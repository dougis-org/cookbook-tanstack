// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Module-level mocks ────────────────────────────────────────────────────
// We mock @/db to control the MongoDB collection used by the admin router.
// We mock @/db/models to control AdminAuditLog.create used for audit logging.

let mockFindUsers: ReturnType<typeof vi.fn>
let mockFindOneUser: ReturnType<typeof vi.fn>
let mockUpdateOne: ReturnType<typeof vi.fn>
let mockInsertOne: ReturnType<typeof vi.fn>

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
    },
  }
})

// ─── Helpers ────────────────────────────────────────────────────────────────

async function makeAdminCaller(userId: string, email = 'admin@test.com') {
  const { appRouter } = await import('@/server/trpc/router')
  return appRouter.createCaller({
    session: { id: 's1' } as never,
    user: { id: userId, email, isAdmin: true } as never,
  })
}

async function makeNonAdminCaller(userId: string, email = 'user@test.com') {
  const { appRouter } = await import('@/server/trpc/router')
  return appRouter.createCaller({
    session: { id: 's1' } as never,
    user: { id: userId, email, isAdmin: false } as never,
  })
}

async function makeAnonCaller() {
  const { appRouter } = await import('@/server/trpc/router')
  return appRouter.createCaller({ session: null, user: null })
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
})

