// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { withCleanDb } from "@/test-helpers/with-clean-db";
import { Recipe, Source } from "@/db/models";
import {
  seedUserWithBetterAuth,
  uid,
  makeAnonCaller,
  makeAuthCaller,
} from "./test-helpers";

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));

const seedUser = seedUserWithBetterAuth;

async function assertSourceRecipeCount(
  sourceName: string,
  expectedCount: number,
) {
  const caller = await makeAnonCaller();
  const result = await caller.sources.list();
  const inserted = result.find((s) => s.name === sourceName);
  expect(inserted).toBeDefined();
  expect(inserted?.recipeCount).toBe(expectedCount);
}

// ─── sources.list ─────────────────────────────────────────────────────────────

describe("sources.list", () => {
  it("returns an array (publicly accessible without auth)", async () => {
    await withCleanDb(async () => {
      const caller = await makeAnonCaller();
      expect(Array.isArray(await caller.sources.list())).toBe(true);
    });
  });

  it("includes a newly inserted source", async () => {
    await withCleanDb(async () => {
      const id = uid();
      await new Source({ name: `ListSource-${id}`, slug: `list-source-${id}` }).save();
      const caller = await makeAnonCaller();
      const result = await caller.sources.list();
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: `ListSource-${id}`, slug: `list-source-${id}` }),
        ]),
      );
    });
  });

  it("includes recipeCount=0 when no recipes reference the source", async () => {
    await withCleanDb(async () => {
      const id = uid();
      await new Source({ name: `NoRefSource-${id}`, slug: `no-ref-source-${id}` }).save();
      const caller = await makeAnonCaller();
      const result = await caller.sources.list();
      for (const item of result) {
        expect(typeof item.recipeCount).toBe("number");
      }
      const inserted = result.find((s) => s.name === `NoRefSource-${id}`);
      expect(inserted?.recipeCount).toBe(0);
      expect(inserted?.slug).toBe(`no-ref-source-${id}`);
    });
  });

  it("counts recipes that reference the source", async () => {
    await withCleanDb(async () => {
      const id = uid();
      const source = await new Source({ name: `RefSource-${id}`, slug: `ref-source-${id}` }).save();
      const user = await seedUser();
      await new Recipe({
        name: "R1",
        userId: user.id,
        isPublic: true,
        sourceId: source._id,
      }).save();
      await new Recipe({
        name: "R2",
        userId: user.id,
        isPublic: true,
        sourceId: source._id,
      }).save();

      await assertSourceRecipeCount(`RefSource-${id}`, 2);
    });
  });
});

// ─── sources.listPage ─────────────────────────────────────────────────────────

describe("sources.listPage", () => {
  it("returns a page sorted by name ascending with a nextCursor when more remain", async () => {
    await withCleanDb(async () => {
      const id = uid();
      await Promise.all(
        Array.from({ length: 105 }, (_, i) =>
          new Source({
            name: `Page-${id}-${String(i).padStart(3, "0")}`,
            slug: `page-${id}-${i}`,
          }).save(),
        ),
      );
      const caller = await makeAnonCaller();
      const result = await caller.sources.listPage({ cursor: 0 });
      expect(result.items).toHaveLength(100);
      const names = result.items.map((s) => s.name);
      expect(names).toEqual([...names].sort());
      expect(result.nextCursor).toBe(100);
    });
  });

  it("returns the remainder and nextCursor null when fewer than limit remain", async () => {
    await withCleanDb(async () => {
      const id = uid();
      await Promise.all(
        Array.from({ length: 3 }, (_, i) =>
          new Source({ name: `Rem-${id}-${i}`, slug: `rem-${id}-${i}` }).save(),
        ),
      );
      const caller = await makeAnonCaller();
      const result = await caller.sources.listPage({ cursor: 0, limit: 100 });
      expect(result.items.length).toBeGreaterThanOrEqual(3);
      expect(result.nextCursor).toBeNull();
    });
  });

  it("rejects a negative cursor", async () => {
    await withCleanDb(async () => {
      const caller = await makeAnonCaller();
      await expect(caller.sources.listPage({ cursor: -1 })).rejects.toThrow();
    });
  });

  it("rejects a limit greater than 100", async () => {
    await withCleanDb(async () => {
      const caller = await makeAnonCaller();
      await expect(
        caller.sources.listPage({ cursor: 0, limit: 101 }),
      ).rejects.toThrow();
    });
  });
});

// ─── sources.search ───────────────────────────────────────────────────────────

describe("sources.search", () => {
  it("returns sources matching query (case-insensitive partial match)", async () => {
    await withCleanDb(async () => {
      const id = uid();
      await new Source({ name: `BonAppetit-${id}`, slug: `bon-appetit-${id}` }).save();
      await new Source({ name: `NewYorkTimes-${id}`, slug: `new-york-times-${id}` }).save();
      const caller = await makeAnonCaller();
      const result = await caller.sources.search({ query: `bonappetit-${id}` });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ name: `BonAppetit-${id}`, slug: `bon-appetit-${id}` });
    });
  });

  it("returns empty array when no sources match", async () => {
    await withCleanDb(async () => {
      const caller = await makeAnonCaller();
      expect(
        await caller.sources.search({ query: "no-such-source-xyz-99999" }),
      ).toEqual([]);
    });
  });

  it("returns up to the validated limit (default 100), sorted by name ascending", async () => {
    await withCleanDb(async () => {
      const id = uid();
      await Promise.all(
        Array.from({ length: 15 }, (_, i) =>
          new Source({ name: `SearchLimit-${id}-${i}`, slug: `search-limit-${id}-${i}` }).save(),
        ),
      );
      const caller = await makeAnonCaller();
      const result = await caller.sources.search({ query: `SearchLimit-${id}` });
      expect(result.length).toBe(15);
      expect(result.length).toBeLessThanOrEqual(100);
      const names = result.map((s) => s.name);
      expect(names).toEqual([...names].sort());
    });
  });

  it("respects an explicit limit lower than the total matches", async () => {
    await withCleanDb(async () => {
      const id = uid();
      await Promise.all(
        Array.from({ length: 15 }, (_, i) =>
          new Source({ name: `SearchCap-${id}-${i}`, slug: `search-cap-${id}-${i}` }).save(),
        ),
      );
      const caller = await makeAnonCaller();
      const result = await caller.sources.search({
        query: `SearchCap-${id}`,
        limit: 5,
      });
      expect(result).toHaveLength(5);
    });
  });

  it("rejects an empty query", async () => {
    await withCleanDb(async () => {
      const caller = await makeAnonCaller();
      await expect(caller.sources.search({ query: "" })).rejects.toThrow();
    });
  });

  it("rejects a query longer than 255 characters", async () => {
    await withCleanDb(async () => {
      const caller = await makeAnonCaller();
      await expect(
        caller.sources.search({ query: "x".repeat(256) }),
      ).rejects.toThrow();
    });
  });

  it("rejects a limit outside 1-100", async () => {
    await withCleanDb(async () => {
      const caller = await makeAnonCaller();
      await expect(
        caller.sources.search({ query: "a", limit: 0 }),
      ).rejects.toThrow();
      await expect(
        caller.sources.search({ query: "a", limit: 101 }),
      ).rejects.toThrow();
    });
  });
});

// ─── sources.byId ─────────────────────────────────────────────────────────────

describe("sources.byId", () => {
  it("returns the source by id with the slug", async () => {
    await withCleanDb(async () => {
      const id = uid();
      const source = await new Source({ name: `ByIdSource-${id}`, slug: `by-id-source-${id}` }).save();
      const caller = await makeAnonCaller();
      const result = await caller.sources.byId({ id: source._id.toString() });
      expect(result).toBeDefined();
      expect(result).toMatchObject({
        id: source._id.toString(),
        name: `ByIdSource-${id}`,
        slug: `by-id-source-${id}`,
      });
    });
  });

  it("returns null when source is not found", async () => {
    await withCleanDb(async () => {
      const caller = await makeAnonCaller();
      const result = await caller.sources.byId({ id: "000000000000000000000000" });
      expect(result).toBeNull();
    });
  });
});

// ─── sources.create ──────────────────────────────────────────────────────────

describe("sources.create", () => {
  it("rejects unauthenticated requests", async () => {
    await withCleanDb(async () => {
      const caller = await makeAnonCaller();
      await expect(caller.sources.create({ name: "Test" })).rejects.toThrow(
        "UNAUTHORIZED",
      );
    });
  });

  it.each([
    [{ name: "My Cookbook" }, { name: "My Cookbook" }],
    [
      { name: "Web Source", url: "https://example.com" },
      { name: "Web Source", url: "https://example.com" },
    ],
  ])(
    "creates source with input %o and returns the record",
    async (input, expected) => {
      await withCleanDb(async () => {
        const user = await seedUser();
        const caller = await makeAuthCaller(user.id);
        const result = await caller.sources.create(input);
        expect(result).toMatchObject(expected);
        expect(result.id).toEqual(expect.any(String));
      });
    },
  );

  it("returns CONFLICT when a source with the same slugified name already exists", async () => {
    await withCleanDb(async () => {
      const user = await seedUser();
      const caller = await makeAuthCaller(user.id);
      await caller.sources.create({ name: "Bon Appetit" });
      await expect(
        caller.sources.create({ name: "Bon Appetit" }),
      ).rejects.toThrow("A source with this slug already exists");
    });
  });
});
