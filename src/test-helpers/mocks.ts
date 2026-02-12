import { vi } from "vitest"

/**
 * Creates a mock Drizzle database that supports all query chain patterns.
 *
 * Handles both simple queries (select().from() for taxonomy) and
 * filtered queries (select().from().where() for recipes/cookbooks).
 *
 * @param result - The rows returned by select/insert/update operations
 */
export function createMockDb(result: unknown[] = []) {
  // select().from(table) returns result directly (taxonomy)
  // select().from(table).where(cond) returns result via where() (filtered queries)
  const mockWhere = vi.fn().mockReturnValue(result)
  const mockFrom = vi.fn().mockReturnValue(
    Object.assign([...result], { where: mockWhere }),
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

  return {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  } as never
}
