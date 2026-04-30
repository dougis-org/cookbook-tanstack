# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix-visibilityfilter-hidden-by-tier-owner-tests` then immediately `git push -u origin fix-visibilityfilter-hidden-by-tier-owner-tests`

## Execution

### T-1: Add behavioral test for `cookbooks.list` — owner with hidden cookbook cannot see it

**File:** `src/server/trpc/routers/__tests__/cookbooks.test.ts`

In the existing `cookbooks.list — hiddenByTier in response` describe block (line 919), add a test:

```typescript
it("owner cannot see hiddenByTier cookbook in list", async () => {
  await withCleanDb(async () => {
    const owner = await seedUser();
    await new Cookbook({ name: "Visible Cookbook", userId: owner.id, isPublic: true }).save();
    await Cookbook.collection.insertOne({
      name: "Hidden Cookbook",
      userId: new Types.ObjectId(owner.id),
      isPublic: true,
      hiddenByTier: true,
      recipes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const caller = await makeAuthCaller(owner.id);
    const results = await caller.cookbooks.list();
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Visible Cookbook");
  });
});
```

Add this test after line 931 (after the existing `hiddenByTier in response` test).

**Verification:** Run `npm run test -- --run src/server/trpc/routers/__tests__/cookbooks.test.ts` and confirm the new test passes.

---

### T-2: Add behavioral test for `cookbooks.byId` — owner requesting own hidden cookbook returns null

**File:** `src/server/trpc/routers/__tests__/cookbooks.test.ts`

After the `cookbooks.byId — hiddenByTier in response` describe block (after line 946), add:

```typescript
describe("cookbooks.byId — hiddenByTier (owner exclusion)", () => {
  it("owner cannot see own hiddenByTier cookbook byId — returns null", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const hiddenCb = await Cookbook.collection.insertOne({
        name: "Hidden Cookbook",
        userId: new Types.ObjectId(owner.id),
        isPublic: true,
        hiddenByTier: true,
        recipes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const caller = await makeAuthCaller(owner.id);
      const result = await caller.cookbooks.byId({ id: hiddenCb.insertedId.toString() });
      expect(result).toBeNull();
    });
  });
});
```

**Verification:** Run `npm run test -- --run src/server/trpc/routers/__tests__/cookbooks.test.ts` and confirm the new test passes.

---

### T-3: Add behavioral test for `recipes.list` — owner with hidden recipe cannot see it

**File:** `src/server/trpc/routers/__tests__/recipes.test.ts`

Extend the existing `recipes.list — hiddenByTier in response` describe block (line 1838). After the existing test (after line 1849), add:

```typescript
it("owner cannot see hiddenByTier recipe in list", async () => {
  await withCleanDb(async () => {
    const owner = await seedUser();
    await new Recipe({ name: "Visible Recipe", userId: owner.id, isPublic: true }).save();
    await Recipe.collection.insertOne({
      name: "Hidden Recipe",
      userId: new Types.ObjectId(owner.id),
      isPublic: true,
      hiddenByTier: true,
      mealIds: [],
      courseIds: [],
      preparationIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const caller = await makeAuthCaller(owner.id);
    const result = await caller.recipes.list({ userId: owner.id });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe("Visible Recipe");
  });
});
```

**Verification:** Run `npm run test -- --run src/server/trpc/routers/__tests__/recipes.test.ts` and confirm the new test passes.

---

### T-4: Add behavioral test for `recipes.byId` — owner requesting own hidden recipe returns null

**File:** `src/server/trpc/routers/__tests__/recipes.test.ts`

After the `recipes.list — hiddenByTier in response` describe block (after line 1849), add:

```typescript
describe("recipes.byId — hiddenByTier (owner exclusion)", () => {
  it("owner cannot see own hiddenByTier recipe byId — returns null", async () => {
    await withCleanDb(async () => {
      const owner = await seedUser();
      const inserted = await Recipe.collection.insertOne({
        name: "Hidden Recipe",
        userId: new Types.ObjectId(owner.id),
        isPublic: true,
        hiddenByTier: true,
        mealIds: [],
        courseIds: [],
        preparationIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const caller = await makeAuthCaller(owner.id);
      const result = await caller.recipes.byId({ id: inserted.insertedId.toString() });
      expect(result).toBeNull();
    });
  });
});
```

**Verification:** Run `npm run test -- --run src/server/trpc/routers/__tests__/recipes.test.ts` and confirm the new test passes.

---

### T-5: Add `visibilityFilter` behavior tests in `helpers.test.ts`

**File:** `src/server/trpc/routers/__tests__/helpers.test.ts`

In the existing `visibilityFilter` describe block (after line 24), add a new sub-describe block with DB-backed tests:

```typescript
describe("visibilityFilter — behavior with actual documents", () => {
  it("excludes hiddenByTier docs for owner — cookbooks", async () => {
    await withCleanDb(async () => {
      const { Cookbook } = await import("@/db/models");
      const { visibilityFilter } = await import("../_helpers");
      const owner = await seedUserWithBetterAuth();
      await new Cookbook({ name: "Visible", userId: owner.id, isPublic: true }).save();
      await Cookbook.collection.insertOne({
        name: "Hidden",
        userId: new Types.ObjectId(owner.id),
        isPublic: true,
        hiddenByTier: true,
        recipes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const docs = await Cookbook.find(visibilityFilter({ id: owner.id })).lean();
      expect(docs).toHaveLength(1);
      expect(docs[0].name).toBe("Visible");
    });
  });

  it("excludes hiddenByTier docs for owner — recipes", async () => {
    await withCleanDb(async () => {
      const { Recipe } = await import("@/db/models");
      const { visibilityFilter } = await import("../_helpers");
      const owner = await seedUserWithBetterAuth();
      await new Recipe({ name: "Visible", userId: owner.id, isPublic: true }).save();
      await Recipe.collection.insertOne({
        name: "Hidden",
        userId: new Types.ObjectId(owner.id),
        isPublic: true,
        hiddenByTier: true,
        mealIds: [],
        courseIds: [],
        preparationIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const docs = await Recipe.find(visibilityFilter({ id: owner.id })).lean();
      expect(docs).toHaveLength(1);
      expect(docs[0].name).toBe("Visible");
    });
  });

  it("excludes hiddenByTier docs for anonymous user — cookbooks", async () => {
    await withCleanDb(async () => {
      const { Cookbook } = await import("@/db/models");
      const { visibilityFilter } = await import("../_helpers");
      const owner = await seedUserWithBetterAuth();
      await Cookbook.collection.insertOne({
        name: "Hidden",
        userId: new Types.ObjectId(owner.id),
        isPublic: true,
        hiddenByTier: true,
        recipes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const docs = await Cookbook.find(visibilityFilter(null)).lean();
      expect(docs).toHaveLength(0);
    });
  });
});
```

**Verification:** Run `npm run test -- --run src/server/trpc/routers/__tests__/helpers.test.ts` and confirm the new tests pass.

---

### T-6: Verify full test suite passes

After all individual tests pass, run the full suite:

```bash
npm run test
```

Confirm all tests pass with no regressions.

---

## Validation

- [ ] `npm run test -- --run src/server/trpc/routers/__tests__/cookbooks.test.ts` — all pass
- [ ] `npm run test -- --run src/server/trpc/routers/__tests__/recipes.test.ts` — all pass
- [ ] `npm run test -- --run src/server/trpc/routers/__tests__/helpers.test.ts` — all pass
- [ ] `npx tsc --noEmit` — no TypeScript errors
- [ ] `npm run test` — full test suite passes

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — run `npm run test -- --run`; all tests must pass
- **TypeScript** — run `npx tsc --noEmit`; no errors
- **Build** — run `npm run build`; build must succeed
- If **ANY** of the above fail, **MUST** iterate and address the failure before pushing

## PR and Merge

- [ ] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `fix-visibilityfilter-hidden-by-tier-owner-tests` to `main`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments autonomously; address each one, commit fixes, push; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status; diagnose and fix any failure, commit fixes, push; wait 180 seconds then repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify user

Ownership metadata:

- Implementer: (to be assigned)
- Reviewer(s): (to be assigned)
- Required approvals: 1

Blocking resolution flow:

- CI failure → diagnose → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Close GitHub issue #410 with reference to the merged PR
- [x] Archive the change: move `openspec/changes/fix-visibilityfilter-hidden-by-tier-owner-tests/` to `openspec/changes/archive/2026-04-30-fix-visibilityfilter-hidden-by-tier-owner-tests/` — stage both the new location and the deletion of the old location in a **single commit**
- [x] Confirm `openspec/changes/archive/2026-04-30-fix-visibilityfilter-hidden-by-tier-owner-tests/` exists and `openspec/changes/fix-visibilityfilter-hidden-by-tier-owner-tests/` is gone
- [x] Commit and push the archive to the default branch in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d fix-visibilityfilter-hidden-by-tier-owner-tests`