// @vitest-environment node
/**
 * Unit tests for with-clean-db.ts.
 *
 * We mock mongoose and MongoDB dependencies so these tests do not require a real MongoDB connection.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  vi.resetModules();
});

describe("withCleanDb", () => {
  it("clears all collections before running the function", async () => {
    const mockMongooseDeleteMany = vi.fn().mockResolvedValue(undefined);
    const mockBetterAuthDeleteMany = vi.fn().mockResolvedValue(undefined);
    const mockCollections = {
      recipes: { deleteMany: mockMongooseDeleteMany },
      user: { deleteMany: mockMongooseDeleteMany },
    };

    vi.doMock("mongoose", () => ({
      default: {
        connection: {
          collections: mockCollections,
          db: {
            listCollections: vi
              .fn()
              .mockReturnValue({
                toArray: vi
                  .fn()
                  .mockResolvedValue([
                    { name: "recipes" },
                    { name: "user" },
                    { name: "session" },
                    { name: "account" },
                  ]),
              }),
            collection: vi.fn().mockReturnValue({
              deleteMany: mockBetterAuthDeleteMany,
            }),
          },
          getClient: vi.fn().mockReturnValue({
            db: vi.fn().mockReturnValue({
              listCollections: vi
                .fn()
                .mockReturnValue({
                  toArray: vi
                    .fn()
                    .mockResolvedValue([
                      { name: "recipes" },
                      { name: "user" },
                      { name: "session" },
                      { name: "account" },
                    ]),
                }),
              collection: vi.fn().mockReturnValue({
                deleteMany: mockBetterAuthDeleteMany,
              }),
            }),
          }),
        },
      },
    }));

    const { withCleanDb } = await import("@/test-helpers/with-clean-db");
    const fn = vi.fn().mockResolvedValue("result");

    await withCleanDb(fn);

    // Should clear the mongoose collections via their own deleteMany
    expect(mockMongooseDeleteMany).toHaveBeenCalledTimes(2);

    // Should also delete in db for non-Mongoose collections (session/account) only
    expect(mockBetterAuthDeleteMany).toHaveBeenCalledTimes(2);

    expect(fn).toHaveBeenCalledOnce();
  });

  it("returns the function's result", async () => {
    const mockDeleteMany = vi.fn().mockResolvedValue(undefined);

    vi.doMock("mongoose", () => ({
      default: {
        connection: {
          collections: { col1: { deleteMany: mockDeleteMany } },
          getClient: vi.fn().mockReturnValue({
            db: vi.fn().mockReturnValue({
              databaseName: "test",
              listCollections: vi.fn().mockReturnValue({
                toArray: vi.fn().mockResolvedValue([{ name: "col1" }]),
              }),
              collection: vi
                .fn()
                .mockReturnValue({ deleteMany: mockDeleteMany }),
            }),
          }),
        },
      },
    }));

    const { withCleanDb } = await import("@/test-helpers/with-clean-db");
    const result = await withCleanDb(async () => 42);

    expect(result).toBe(42);
  });

  it("works with no collections (empty DB)", async () => {
    vi.doMock("mongoose", () => ({
      default: {
        connection: {
          collections: {},
          getClient: vi.fn().mockReturnValue({
            db: vi.fn().mockReturnValue({
              databaseName: "test",
              listCollections: vi.fn().mockReturnValue({
                toArray: vi.fn().mockResolvedValue([]),
              }),
              collection: vi.fn().mockReturnValue({
                deleteMany: vi.fn().mockResolvedValue(undefined),
              }),
            }),
          }),
        },
      },
    }));

    const { withCleanDb } = await import("@/test-helpers/with-clean-db");
    const fn = vi.fn().mockResolvedValue("empty");

    await expect(withCleanDb(fn)).resolves.toBe("empty");
    expect(fn).toHaveBeenCalledOnce();
  });

  it("propagates errors thrown by the function", async () => {
    vi.doMock("mongoose", () => ({
      default: {
        connection: {
          collections: {},
          getClient: vi.fn().mockReturnValue({
            db: vi.fn().mockReturnValue({
              databaseName: "test",
              collection: vi.fn().mockReturnValue({
                deleteMany: vi.fn().mockResolvedValue(undefined),
              }),
            }),
          }),
        },
      },
    }));

    const { withCleanDb } = await import("@/test-helpers/with-clean-db");
    const fn = vi.fn().mockRejectedValue(new Error("fn error"));

    await expect(withCleanDb(fn)).rejects.toThrow("fn error");
  });
});
