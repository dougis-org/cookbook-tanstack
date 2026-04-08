import { test, expect } from "@bgotink/playwright-coverage";
import type { Page } from "@playwright/test";
import { registerAndLogin, login } from "./helpers/auth";
import { gotoAndWaitForHydration } from "./helpers/app";
import { getUniqueCookbookName } from "./helpers/cookbooks";
import { submitRecipeForm, getUniqueRecipeName } from "./helpers/recipes";

async function createCookbookAndGetId(
  page: Page,
  name: string,
  isPublic = true,
): Promise<string> {
  await gotoAndWaitForHydration(page, "/cookbooks");
  await page.getByRole("button", { name: "New Cookbook" }).click();
  await page.getByLabel("Name").fill(name);
  if (!isPublic) {
    await page.getByLabel("Public (visible to everyone)").uncheck();
  }
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await page.waitForLoadState("networkidle");
  // Extract ID from the link href before clicking to avoid URL-parsing race conditions
  const cookbookLink = page.getByRole("link").filter({ hasText: name }).first();
  await cookbookLink.waitFor({ state: "visible" });
  const href = await cookbookLink.getAttribute("href");
  expect(
    href,
    `Failed to read href for cookbook link with name "${name}".`,
  ).toBeTruthy();
  const match = href!.match(/\/cookbooks\/([a-f0-9]{24})\b/);
  if (!match || !match[1] || match[1].length !== 24) {
    throw new Error(
      `Failed to parse 24-character cookbook id from href "${href}" for cookbook "${name}".`,
    );
  }
  const cookbookId = match[1];
  await cookbookLink.click();
  await page.waitForURL(/\/cookbooks\/[a-f0-9]{24}$/);
  return cookbookId;
}

async function addRecipeToCookbook(page: Page, recipeName: string) {
  await page.getByRole("button", { name: "Add Recipe" }).click();
  await page.getByRole("dialog").waitFor({ state: "visible" });
  await page.getByText(recipeName).first().click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
}

// ─── Shared setup: public cookbook with two recipes ───────────────────────────

test.describe("Cookbook Print Route — public cookbook", () => {
  let cookbookId: string;
  let recipe1Name: string;
  let recipe2Name: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerAndLogin(page);

    recipe1Name = getUniqueRecipeName("PrintRecipe1");
    recipe2Name = getUniqueRecipeName("PrintRecipe2");
    const cookbookName = getUniqueCookbookName("PrintCookbook");

    // Create two recipes
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, {
      name: recipe1Name,
      ingredients: "Flour\nSugar",
      instructions: "Mix and bake",
      servings: "4",
    });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, {
      name: recipe2Name,
      ingredients: "Butter\nEggs",
      instructions: "Cook gently",
    });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    // Create public cookbook
    await gotoAndWaitForHydration(page, "/cookbooks");
    await page.getByRole("button", { name: "New Cookbook" }).click();
    await page.getByLabel("Name").fill(cookbookName);
    await page.getByRole("button", { name: "Create", exact: true }).click();
    await page.waitForLoadState("networkidle");

    // Navigate to cookbook and add both recipes
    await page.getByText(cookbookName).first().click();
    await page.waitForURL(/\/cookbooks\/[a-f0-9]{24}$/);
    const idMatch = page.url().match(/\/cookbooks\/([a-f0-9]{24})$/);
    if (!idMatch)
      throw new Error(`Failed to parse cookbook id from URL "${page.url()}"`);
    cookbookId = idMatch[1];

    await addRecipeToCookbook(page, recipe1Name);
    await addRecipeToCookbook(page, recipe2Name);

    await page.close();
  });

  // 4.1
  test("unauthenticated user can load print route for a public cookbook without redirect", async ({
    page,
  }) => {
    await page.context().clearCookies();
    await gotoAndWaitForHydration(
      page,
      `/cookbooks/${cookbookId}/print?displayonly=1`,
    );
    expect(page.url()).toContain(`/cookbooks/${cookbookId}/print`);
    await expect(page.getByText("Cookbook not found")).not.toBeVisible();
  });

  // 4.3
  test("TOC section lists all recipes in cookbook order with correct 1-based position numbers", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(
      page,
      `/cookbooks/${cookbookId}/print?displayonly=1`,
    );
    await expect(page.getByText("1.")).toBeVisible();
    await expect(page.getByText("2.")).toBeVisible();
    await expect(page.getByText(recipe1Name).first()).toBeVisible();
    await expect(page.getByText(recipe2Name).first()).toBeVisible();
  });

  test("displayonly mode shows #N labels for recipe sections and no pg-prefixed labels", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(
      page,
      `/cookbooks/${cookbookId}/print?displayonly=1`,
    );

    const sections = page.locator(".cookbook-recipe-section");
    const labels = page.locator(".cookbook-recipe-position-label");
    await expect(sections).toHaveCount(2);
    await expect(labels).toHaveCount(2);
    await expect(labels.nth(0)).toHaveText("#1");
    await expect(labels.nth(1)).toHaveText("#2");
    await expect(page.getByText(/^pg \d+$/)).toHaveCount(0);
  });

  // 4.4
  test("each recipe section has the cookbook-recipe-section CSS class", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(
      page,
      `/cookbooks/${cookbookId}/print?displayonly=1`,
    );
    const sections = page.locator(".cookbook-recipe-section");
    await expect(sections).toHaveCount(2);
  });

  // 4.5
  test("computed style of .cookbook-recipe-section has page-break rules", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(
      page,
      `/cookbooks/${cookbookId}/print?displayonly=1`,
    );
    await page.emulateMedia({ media: "print" });
    const section = page.locator(".cookbook-recipe-section").first();
    await expect(section).toHaveCSS("break-before", "page");
    await page.emulateMedia({ media: "screen" });
  });

  // 4.6
  test("no img elements are present on the print route", async ({ page }) => {
    await gotoAndWaitForHydration(
      page,
      `/cookbooks/${cookbookId}/print?displayonly=1`,
    );
    await expect(page.locator(".cookbook-recipe-section img")).toHaveCount(0);
  });

  // 4.7
  test("serving controls are hidden when print media is active on the print route", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(
      page,
      `/cookbooks/${cookbookId}/print?displayonly=1`,
    );
    await expect(
      page.getByRole("button", { name: /increase servings/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /decrease servings/i }),
    ).toBeVisible();
    await page.emulateMedia({ media: "print" });
    await expect(
      page.getByRole("button", { name: /increase servings/i }),
    ).toBeHidden();
    await expect(
      page.getByRole("button", { name: /decrease servings/i }),
    ).toBeHidden();
    await page.emulateMedia({ media: "screen" });
  });

  // 4.8
  test("back link and Print button carry the print:hidden class", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(
      page,
      `/cookbooks/${cookbookId}/print?displayonly=1`,
    );
    const backLink = page.getByRole("link", { name: /back to cookbook/i });
    await expect(backLink).toHaveClass(/print:hidden/);
    const printBtn = page.getByRole("button", { name: /print/i });
    await expect(printBtn).toHaveClass(/print:hidden/);
  });

  // 4.1 — TOC <ol> carries print:columns-2 class
  test("TOC <ol> in the print route carries the print:columns-2 class", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(
      page,
      `/cookbooks/${cookbookId}/print?displayonly=1`,
    );
    const tocList = page.locator("ol").first();
    await expect(tocList).toHaveClass(/print:columns-2/);
  });

  // 4.3 — TOC recipe entries are <a> links to /recipes/$recipeId
  test("TOC recipe entries in the print route are links to /recipes/$recipeId", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(
      page,
      `/cookbooks/${cookbookId}/print?displayonly=1`,
    );
    // All recipe entries in the TOC <ol> should be <a> links to recipe pages
    const tocLinks = page.locator("ol").first().locator("a");
    const count = await tocLinks.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(tocLinks.nth(i)).toHaveAttribute(
        "href",
        /\/recipes\/[a-f0-9-]+/,
      );
    }
  });
});

// ─── Private cookbook ─────────────────────────────────────────────────────────

// 4.2
test("unauthenticated user sees not-found state for a private cookbook print route", async ({
  page,
}) => {
  await registerAndLogin(page);
  const cookbookName = getUniqueCookbookName("PrivatePrint");
  const cookbookId = await createCookbookAndGetId(page, cookbookName, false);

  await page.context().clearCookies();
  await gotoAndWaitForHydration(
    page,
    `/cookbooks/${cookbookId}/print?displayonly=1`,
  );
  await expect(page.getByText("Cookbook not found")).toBeVisible();
});

// ─── Cookbook with chapters ────────────────────────────────────────────────────

// 4.2 — chapter-grouped TOC in the print route
test.describe("Cookbook Print Route — with chapters", () => {
  let cookbookId: string;
  let recipe1Name: string;
  let recipe2Name: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerAndLogin(page);

    recipe1Name = getUniqueRecipeName("ChapterPrint1");
    recipe2Name = getUniqueRecipeName("ChapterPrint2");
    const cookbookName = getUniqueCookbookName("ChapterPrintCookbook");

    // Create two recipes
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, {
      name: recipe1Name,
      ingredients: "Flour",
      instructions: "Mix",
      servings: "2",
    });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, {
      name: recipe2Name,
      ingredients: "Butter",
      instructions: "Melt",
    });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    // Create cookbook and get its ID
    cookbookId = await createCookbookAndGetId(page, cookbookName);

    // Add both recipes
    await addRecipeToCookbook(page, recipe1Name);
    await addRecipeToCookbook(page, recipe2Name);

    // Create a chapter (migrates existing recipes into it)
    await page.getByRole("button", { name: "New Chapter" }).click();
    await expect(page.getByRole("heading", { name: /Chapter 1/i })).toBeVisible(
      { timeout: 20000 },
    );

    await page.close();
  });

  test("print route TOC renders chapter headings above their grouped recipes", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(
      page,
      `/cookbooks/${cookbookId}/print?displayonly=1`,
    );
    await expect(
      page.getByRole("heading", { name: /Chapter 1/i }),
    ).toBeVisible();
    // Recipes should appear under the chapter heading
    await expect(page.getByText(recipe1Name).first()).toBeVisible();
    await expect(page.getByText(recipe2Name).first()).toBeVisible();
  });
});

// ─── Auto-trigger behavior ────────────────────────────────────────────────────

test.describe("Cookbook Print Route — auto-trigger", () => {
  let cookbookId: string;
  let ownerEmail: string;
  let ownerPassword: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const creds = await registerAndLogin(page);
    ownerEmail = creds.email;
    ownerPassword = creds.password;

    const cookbookName = getUniqueCookbookName("AutoTriggerPrint");
    cookbookId = await createCookbookAndGetId(page, cookbookName);

    const recipeName = getUniqueRecipeName("AutoTriggerRecipe");
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, {
      name: recipeName,
      ingredients: "Salt",
      instructions: "Season",
      servings: "1",
    });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    await gotoAndWaitForHydration(page, `/cookbooks/${cookbookId}`);
    await addRecipeToCookbook(page, recipeName);

    await page.close();
  });

  test("window.print is called automatically when navigating to the print route without ?displayonly=1", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (window as unknown as Record<string, unknown>).__printCalled = false;
      window.print = () => {
        (window as unknown as Record<string, unknown>).__printCalled = true;
      };
    });
    // Use the same user who created the data to ensure recipes are visible
    await login(page, ownerEmail, ownerPassword);
    await gotoAndWaitForHydration(page, `/cookbooks/${cookbookId}/print`);
    await page.waitForFunction(
      () =>
        (window as unknown as Record<string, unknown>).__printCalled === true,
    );
    const printCalled = await page.evaluate(
      () => (window as unknown as Record<string, unknown>).__printCalled,
    );
    expect(printCalled).toBe(true);
  });

  test("window.print is NOT called when navigating to the print route with ?displayonly=1", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (window as unknown as Record<string, unknown>).__printCalled = false;
      window.print = () => {
        (window as unknown as Record<string, unknown>).__printCalled = true;
      };
    });
    await login(page, ownerEmail, ownerPassword);
    await gotoAndWaitForHydration(
      page,
      `/cookbooks/${cookbookId}/print?displayonly=1`,
    );
    await expect(page.getByText("Loading…")).not.toBeVisible();
    const printCalled = await page.evaluate(
      () => (window as unknown as Record<string, unknown>).__printCalled,
    );
    expect(printCalled).toBe(false);
  });
});

// ─── Cookbook detail navigation ───────────────────────────────────────────────

// 4.9
test("Print button on cookbook detail page is an <a> Link pointing to the print route URL", async ({
  page,
}) => {
  await registerAndLogin(page);
  const cookbookName = getUniqueCookbookName("NavPrint");
  const cookbookId = await createCookbookAndGetId(page, cookbookName);

  const printLink = page.getByRole("link", { name: "Print", exact: true });
  await expect(printLink).toBeVisible();
  await expect(printLink).toHaveAttribute(
    "href",
    `/cookbooks/${cookbookId}/print`,
  );
});
