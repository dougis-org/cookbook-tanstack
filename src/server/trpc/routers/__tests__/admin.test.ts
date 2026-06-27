// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Module-level mocks ────────────────────────────────────────────────────
// We mock @/db to control the MongoDB collection used by the admin router.
// We mock @/db/models to control AdminAuditLog.create used for audit logging.

let mockFindUsers: ReturnType<typeof vi.fn>
let mockFindOneUser: ReturnType<typeof vi.fn>
let mockUpdateOne: ReturnType<typeof vi.fn>
let mockInsertOne: ReturnType<typeof vi.fn>
let mockAuditLogFind: ReturnType<typeof vi.fn>
let mockAuditLogCount: ReturnType<typeof vi.fn>
const { mockSendEmail, mockReconcileUserContent } = vi.hoisted(() => ({
  mockSendEmail: vi.fn().mockResolvedValue({ messageId: 'test-id' }),
  mockReconcileUserContent: vi.fn().mockResolvedValue({
    recipesUpdated: 0,
    cookbooksUpdated: 0,
    recipesHidden: 10,
    cookbooksHidden: 2,
    madePublic: 1,
  }),
}))

vi.mock('@/lib/mail', () => ({
  sendEmail: mockSendEmail,
}))

vi.mock('@/lib/reconcile-user-content', () => ({
  reconcileUserContent: mockReconcileUserContent,
}))

vi.mock('@/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/db')>()
  return {
    ...actual,
    getMongoClient: () => ({
      db: () => ({
        collection: (name: string) => {
          if (name === 'user') {
            return {
              find: () => ({ toArray: mockFindUsers }),
              findOne: mockFindOneUser,
              updateOne: mockUpdateOne,
            }
          }
          return {}
        },
      }),
    }),
  }
})

vi.mock('@/db/models', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/db/models')>()
  return {
    ...actual,
    AdminAuditLog: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: (...args: any[]) => (mockInsertOne as (...a: any[]) => unknown)(...args),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      find: (filter: unknown) => ({
        sort: () => ({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          skip: () => ({ limit: () => (mockAuditLogFind as (...a: any[]) => unknown)(filter) }),
        }),
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      countDocuments: (...args: any[]) => (mockAuditLogCount as (...a: any[]) => unknown)(...args),
    },
  }
})

// ─── Helpers ────────────────────────────────────────────────────────────────

async function makeAdminCaller(userId: string, email = 'admin@test.com') {
  const { appRouter } = await import('@/server/trpc/router')
  return appRouter.createCaller({
    session: { id: 's1' } as never,
    user: { id: userId, email, isAdmin: true } as never,
    collabCookbookIds: [],
  })
}

async function makeNonAdminCaller(userId: string, email = 'user@test.com') {
  const { appRouter } = await import('@/server/trpc/router')
  return appRouter.createCaller({
    session: { id: 's1' } as never,
    user: { id: userId, email, isAdmin: false } as never,
    collabCookbookIds: [],
  })
}

async function makeAnonCaller() {
  const { appRouter } = await import('@/server/trpc/router')
  return appRouter.createCaller({ session: null, user: null, collabCookbookIds: [] })
}

const ADMIN_ID = '0'.repeat(24)
const TARGET_ID = '1'.repeat(24)

function makeUserDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toHexString: () => TARGET_ID },
    email: 'target@test.com',
    emailVerified: true,
    name: 'Target User',
    createdAt: new Date(),
    updatedAt: new Date(),
    tier: 'home-cook',
    isAdmin: false,
    ...overrides,
  }
}

function makeAuditDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => 'auditid000000000000000001' },
    adminId: ADMIN_ID,
    adminEmail: 'admin@test.com',
    targetUserId: TARGET_ID,
    targetEmail: 'target@test.com',
    action: 'set-tier',
    before: { tier: 'home-cook' },
    after: { tier: 'sous-chef' },
    createdAt: new Date('2024-01-15T12:00:00Z'),
    updatedAt: new Date('2024-01-15T12:00:00Z'),
    ...overrides,
  }
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('admin.users.list', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFindUsers = vi.fn().mockResolvedValue([makeUserDoc()])
    mockFindOneUser = vi.fn()
    mockUpdateOne = vi.fn()
    mockInsertOne = vi.fn().mockResolvedValue({ acknowledged: true })
  })

  it('returns all user documents transformed via transformUserDoc when caller is admin', async () => {
    const caller = await makeAdminCaller(ADMIN_ID)
    const result = await caller.admin.users.list()
    expect(result).toHaveLength(1)
    expect(result[0]).toHaveProperty('id', TARGET_ID)
    expect(result[0]).toHaveProperty('email', 'target@test.com')
  })

  it('returns empty array when no users exist', async () => {
    mockFindUsers = vi.fn().mockResolvedValue([])
    const caller = await makeAdminCaller(ADMIN_ID)
    const result = await caller.admin.users.list()
    expect(result).toEqual([])
  })

  it('throws UNAUTHORIZED when session is absent', async () => {
    const caller = await makeAnonCaller()
    await expect(caller.admin.users.list()).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })

  it('throws FORBIDDEN when caller is authenticated but isAdmin is false', async () => {
    const caller = await makeNonAdminCaller(TARGET_ID)
    await expect(caller.admin.users.list()).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })
})

describe('admin.users.setTier', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendEmail.mockClear()
    mockFindUsers = vi.fn().mockResolvedValue([])
    mockFindOneUser = vi.fn().mockResolvedValue(makeUserDoc({ tier: 'home-cook' }))
    mockUpdateOne = vi.fn().mockResolvedValue({ acknowledged: true })
    mockInsertOne = vi.fn().mockResolvedValue({ acknowledged: true })
  })

  it('updates tier and writes audit log on successful tier change', async () => {
    const caller = await makeAdminCaller(ADMIN_ID, 'admin@test.com')
    const result = await caller.admin.users.setTier({ userId: TARGET_ID, tier: 'sous-chef' })
    expect(result).toMatchObject({ success: true })
    expect(mockUpdateOne).toHaveBeenCalledOnce()
    expect(mockInsertOne).toHaveBeenCalledOnce()
    const logArg = mockInsertOne.mock.calls[0][0]
    expect(logArg).toMatchObject({
      adminId: ADMIN_ID,
      adminEmail: 'admin@test.com',
      targetUserId: TARGET_ID,
      targetEmail: 'target@test.com',
      action: 'set-tier',
      before: { tier: 'home-cook' },
      after: { tier: 'sous-chef' },
    })
  })

  it('returns early with no DB write and no audit log when new tier equals current tier', async () => {
    const caller = await makeAdminCaller(ADMIN_ID)
    const result = await caller.admin.users.setTier({ userId: TARGET_ID, tier: 'home-cook' })
    expect(result).toMatchObject({ success: true, noOp: true })
    expect(mockUpdateOne).not.toHaveBeenCalled()
    expect(mockInsertOne).not.toHaveBeenCalled()
  })

  it('throws FORBIDDEN when targetUserId equals caller id (self-change)', async () => {
    const caller = await makeAdminCaller(TARGET_ID)
    await expect(
      caller.admin.users.setTier({ userId: TARGET_ID, tier: 'sous-chef' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('throws BAD_REQUEST when tier input is not a valid UserTier value', async () => {
    const caller = await makeAdminCaller(ADMIN_ID)
    await expect(
      caller.admin.users.setTier({ userId: TARGET_ID, tier: 'invalid-tier' as never }),
    ).rejects.toThrow()
  })

  it('throws BAD_REQUEST when userId is not a valid ObjectId format', async () => {
    const caller = await makeAdminCaller(ADMIN_ID)
    await expect(
      caller.admin.users.setTier({ userId: 'not-a-valid-id', tier: 'sous-chef' }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' })
  })

  it('throws NOT_FOUND when target user does not exist', async () => {
    mockFindOneUser = vi.fn().mockResolvedValue(null)
    const caller = await makeAdminCaller(ADMIN_ID)
    await expect(
      caller.admin.users.setTier({ userId: TARGET_ID, tier: 'sous-chef' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('throws FORBIDDEN when caller is not admin', async () => {
    const caller = await makeNonAdminCaller(ADMIN_ID)
    await expect(
      caller.admin.users.setTier({ userId: TARGET_ID, tier: 'sous-chef' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('throws UNAUTHORIZED when session is absent', async () => {
    const caller = await makeAnonCaller()
    await expect(
      caller.admin.users.setTier({ userId: TARGET_ID, tier: 'sous-chef' }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })

  it('returns success when audit log insertOne throws — tier change persists', async () => {
    mockInsertOne = vi.fn().mockRejectedValue(new Error('Audit write failed'))
    const caller = await makeAdminCaller(ADMIN_ID)
    const result = await caller.admin.users.setTier({ userId: TARGET_ID, tier: 'sous-chef' })
    expect(result).toMatchObject({ success: true })
    expect(mockUpdateOne).toHaveBeenCalledOnce()
  })

  it('does not surface audit log error to caller when audit write fails', async () => {
    mockInsertOne = vi.fn().mockRejectedValue(new Error('Audit write failed'))
    const caller = await makeAdminCaller(ADMIN_ID)
    await expect(
      caller.admin.users.setTier({ userId: TARGET_ID, tier: 'sous-chef' }),
    ).resolves.not.toThrow()
  })

  it('calls sendEmail when a tier changes', async () => {
    const caller = await makeAdminCaller(ADMIN_ID)
    const { TierNotificationEmail } = await import('@/emails/TierNotificationEmail')
    await caller.admin.users.setTier({ userId: TARGET_ID, tier: 'executive-chef' })
    expect(mockSendEmail).toHaveBeenCalledOnce()
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'target@test.com',
        text: 'Your My CookBooks culinary tier has been updated to Executive Chef.',
        react: expect.objectContaining({
          type: TierNotificationEmail,
          props: expect.objectContaining({
            tier: 'executive-chef',
            name: 'Target User',
            changeType: 'upgrade',
          }),
        }),
      })
    )
  })

  it('passes reconciliation results to sendEmail', async () => {
    const caller = await makeAdminCaller(ADMIN_ID)
    const { TierNotificationEmail } = await import('@/emails/TierNotificationEmail')
    mockReconcileUserContent.mockResolvedValueOnce({
      recipesUpdated: 0,
      cookbooksUpdated: 0,
      recipesHidden: 15,
      cookbooksHidden: 3,
      madePublic: 2,
    })
    mockFindOneUser.mockResolvedValueOnce(makeUserDoc({ tier: 'sous-chef' }))

    await caller.admin.users.setTier({ userId: TARGET_ID, tier: 'home-cook' })

    expect(mockSendEmail).toHaveBeenCalledOnce()
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'target@test.com',
        text: 'Your My CookBooks culinary tier has been updated to Home Cook.',
        react: expect.objectContaining({
          type: TierNotificationEmail,
          props: expect.objectContaining({
            tier: 'home-cook',
            name: 'Target User',
            changeType: 'downgrade',
            recipesHidden: 15,
            cookbooksHidden: 3,
            madePublic: 2,
          }),
        }),
      })
    )
  })

  it('does not call sendEmail if the tier is unchanged', async () => {
    const caller = await makeAdminCaller(ADMIN_ID)
    await caller.admin.users.setTier({ userId: TARGET_ID, tier: 'home-cook' })
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('succeeds and calls sendEmail even if reconcileUserContent throws an error', async () => {
    const caller = await makeAdminCaller(ADMIN_ID)
    const { TierNotificationEmail } = await import('@/emails/TierNotificationEmail')
    mockReconcileUserContent.mockRejectedValueOnce(new Error('Reconciliation failed'))
    mockFindOneUser.mockResolvedValueOnce(makeUserDoc({ tier: 'sous-chef' }))

    const result = await caller.admin.users.setTier({ userId: TARGET_ID, tier: 'home-cook' })
    expect(result).toMatchObject({ success: true })
    expect(mockSendEmail).toHaveBeenCalledOnce()
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'target@test.com',
        text: 'Your My CookBooks culinary tier has been updated to Home Cook.',
        react: expect.objectContaining({
          type: TierNotificationEmail,
          props: expect.objectContaining({
            tier: 'home-cook',
            name: 'Target User',
            changeType: 'downgrade',
            recipesHidden: undefined,
            cookbooksHidden: undefined,
            madePublic: undefined,
          }),
        }),
      })
    )
  })
})

describe('admin.auditLog.list', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFindUsers = vi.fn().mockResolvedValue([])
    mockFindOneUser = vi.fn()
    mockUpdateOne = vi.fn()
    mockInsertOne = vi.fn().mockResolvedValue({ acknowledged: true })
    mockAuditLogFind = vi.fn().mockResolvedValue([])
    mockAuditLogCount = vi.fn().mockResolvedValue(0)
  })

  it('returns all entries with offset pagination when no filters applied', async () => {
    const entries = Array.from({ length: 30 }, (_, i) =>
      makeAuditDoc({ _id: { toString: () => `id${i.toString().padStart(20, '0')}` }, createdAt: new Date(2024, 0, 30 - i) }),
    )
    mockAuditLogFind.mockResolvedValue(entries.slice(0, 25))
    mockAuditLogCount.mockResolvedValue(30)

    const caller = await makeAdminCaller(ADMIN_ID)
    const result = await caller.admin.auditLog.list({})

    expect(result.total).toBe(30)
    expect(result.entries).toHaveLength(25)
  })

  it('returns page 2 correctly with correct entry count', async () => {
    const entries = Array.from({ length: 5 }, (_, i) =>
      makeAuditDoc({ _id: { toString: () => `id${i.toString().padStart(20, '0')}` } }),
    )
    mockAuditLogFind.mockResolvedValue(entries)
    mockAuditLogCount.mockResolvedValue(30)

    const caller = await makeAdminCaller(ADMIN_ID)
    const result = await caller.admin.auditLog.list({ page: 2 })

    expect(result.entries).toHaveLength(5)
    expect(result.total).toBe(30)
  })

  it('returns empty entries for out-of-range page', async () => {
    mockAuditLogFind.mockResolvedValue([])
    mockAuditLogCount.mockResolvedValue(10)

    const caller = await makeAdminCaller(ADMIN_ID)
    const result = await caller.admin.auditLog.list({ page: 99 })

    expect(result.entries).toHaveLength(0)
    expect(result.total).toBe(10)
  })

  it('filters by userId and returns only matching entries', async () => {
    const userAEntries = Array.from({ length: 5 }, (_, i) =>
      makeAuditDoc({ _id: { toString: () => `id${i.toString().padStart(20, '0')}` }, targetUserId: TARGET_ID }),
    )
    mockAuditLogFind.mockResolvedValue(userAEntries)
    mockAuditLogCount.mockResolvedValue(5)

    const caller = await makeAdminCaller(ADMIN_ID)
    const result = await caller.admin.auditLog.list({ userId: TARGET_ID })

    expect(result.total).toBe(5)
    expect(result.entries).toHaveLength(5)
    expect(mockAuditLogFind).toHaveBeenCalledWith(expect.objectContaining({ targetUserId: TARGET_ID }))
  })

  it('filters by date range and returns only entries in range', async () => {
    const entry = makeAuditDoc({ createdAt: new Date('2024-03-15T12:00:00Z') })
    mockAuditLogFind.mockResolvedValue([entry])
    mockAuditLogCount.mockResolvedValue(1)

    const caller = await makeAdminCaller(ADMIN_ID)
    const result = await caller.admin.auditLog.list({
      from: '2024-03-01T00:00:00Z',
      to: '2024-03-31T23:59:59Z',
    })

    expect(result.entries).toHaveLength(1)
    expect(mockAuditLogFind).toHaveBeenCalledWith(
      expect.objectContaining({ createdAt: expect.objectContaining({ $gte: expect.any(Date), $lte: expect.any(Date) }) }),
    )
  })

  it('returns valid response when collection is empty', async () => {
    mockAuditLogFind.mockResolvedValue([])
    mockAuditLogCount.mockResolvedValue(0)

    const caller = await makeAdminCaller(ADMIN_ID)
    const result = await caller.admin.auditLog.list({})

    expect(result).toEqual({ entries: [], total: 0 })
  })

  it('throws FORBIDDEN when caller is not admin', async () => {
    const caller = await makeNonAdminCaller(TARGET_ID)
    await expect(caller.admin.auditLog.list({})).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('throws UNAUTHORIZED when session is absent', async () => {
    const caller = await makeAnonCaller()
    await expect(caller.admin.auditLog.list({})).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
  })

  it('maps entry fields to the expected shape', async () => {
    const doc = makeAuditDoc()
    mockAuditLogFind.mockResolvedValue([doc])
    mockAuditLogCount.mockResolvedValue(1)

    const caller = await makeAdminCaller(ADMIN_ID)
    const result = await caller.admin.auditLog.list({})

    expect(result.entries[0]).toMatchObject({
      id: expect.any(String),
      createdAt: expect.any(String),
      adminEmail: 'admin@test.com',
      targetEmail: 'target@test.com',
      before: { tier: 'home-cook' },
      after: { tier: 'sous-chef' },
    })
  })
})
