import { vi } from "vitest"
import type { Mock } from "vitest"

export interface MockDb {
  select: Mock
  insert: Mock
  update: Mock
  delete: Mock
  transaction: Mock
}

/**
 * Creates a mock Drizzle database that supports all query chain patterns.
 *
 * Handles both simple queries (select().from() for taxonomy) and
 * filtered queries (select().from().where() for recipes/cookbooks).
 * Also supports orderBy().limit().offset() chains for pagination,
 * and transaction() by passing itself as the tx argument.
 *
 * @param result - The rows returned by select/insert/update operations
 */
export function createMockDb(result: unknown[] = []): MockDb {
  // Pagination chain: orderBy -> limit -> offset -> result
  const mockOffset = vi.fn().mockReturnValue(result)
  const mockLimit = vi.fn().mockReturnValue(Object.assign([...result], { offset: mockOffset }))
  const mockOrderBy = vi.fn().mockReturnValue(Object.assign([...result], { limit: mockLimit }))

  // select().from(table).where(cond) with optional orderBy/limit/offset
  const mockWhere = vi.fn().mockReturnValue(
    Object.assign([...result], { orderBy: mockOrderBy }),
  )
  const mockGroupBy = vi.fn().mockReturnValue(result)
  const mockLeftJoin = vi.fn().mockReturnValue({ groupBy: mockGroupBy })
  const mockFrom = vi.fn().mockReturnValue(
    Object.assign([...result], { where: mockWhere, leftJoin: mockLeftJoin, orderBy: mockOrderBy }),
  )
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

  // insert().values().returning() chain
  const mockReturning = vi.fn().mockReturnValue(result)
  const mockValues = vi.fn().mockReturnValue(
    Object.assign(Promise.resolve(), { returning: mockReturning }),
  )
  const mockInsert = vi.fn().mockReturnValue({ values: mockValues })

  // update().set().where().returning() chain
  const mockUpdateReturning = vi.fn().mockReturnValue(result)
  const mockUpdateWhere = vi.fn().mockReturnValue({ returning: mockUpdateReturning })
  const mockSet = vi.fn().mockReturnValue({ where: mockUpdateWhere })
  const mockUpdate = vi.fn().mockReturnValue({ set: mockSet })

  // delete().where() chain
  const mockDeleteWhere = vi.fn().mockReturnValue(Promise.resolve())
  const mockDelete = vi.fn().mockReturnValue({ where: mockDeleteWhere })

  const db = {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    // transaction(fn) calls fn with the db itself as the tx argument
    transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(db)),
  }

  return db as MockDb
}
