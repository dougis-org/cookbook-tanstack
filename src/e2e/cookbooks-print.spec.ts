import { test, expect, type Page } from "@playwright/test";
import { registerAndLogin } from "./helpers/auth";
import { gotoAndWaitForHydration } from "./helpers/app";
import { submitRecipeForm, getUniqueRecipeName } from "./helpers/recipes";

async function createCookbookAndGetId(page: Page, name: string, isPublic = true): Promise<string> {
  await gotoAndWaitForHydration(page, "/cookbooks");
  await page.getByRole("button", { name: "New Cookbook" }).click();
  await page.getByLabel("Name").fill(name);
  if (!isPublic) {
    await page.getByLabel("Public (visible to everyone)").uncheck();
  }
  await page.getByRole("button", { name: "Create" }).click();
  await page.waitForLoadState("networkidle");
  await page.getByText(name).first().click();
  await page.waitForURL(/\/cookbooks\/[a-f0-9]+$/);
  return page.url().split("/cookbooks/")[1];
}

async function addRecipeToCookbook(page: Page, recipeName: string) {
  await page.getByRole("button", { name: "Add Recipe" }).click();
  await page.waitForLoadState("networkidle");
  await page.getByText(recipeName).first().click();
  await page.waitForLoadState("networkidle");
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
    const cookbookName = `PrintCookbook-${Date.now()}`;

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
    await page.getByRole("button", { name: "Create" }).click();
    await page.waitForLoadState("networkidle");

    // Navigate to cookbook and add both recipes
    await page.getByText(cookbookName).first().click();
    await page.waitForURL(/\/cookbooks\/[a-f0-9]+$/);
    cookbookId = page.url().split("/cookbooks/")[1];

    await addRecipeToCookbook(page, recipe1Name);
    await addRecipeToCookbook(page, recipe2Name);

    await page.close();
  });

  // 4.1
  test("unauthenticated user can load print route for a public cookbook without redirect", async ({
    page,
  }) => {
    await page.context().clearCookies();
    await gotoAndWaitForHydration(page, `/cookbooks/${cookbookId}/print`);
    expect(page.url()).toContain(`/cookbooks/${cookbookId}/print`);
    await expect(page.getByText("Cookbook not found")).not.toBeVisible();
  });

  // 4.3
  test("TOC section lists all recipes in cookbook order with correct 1-based position numbers", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(page, `/cookbooks/${cookbookId}/print`);
    await expect(page.getByText("1.")).toBeVisible();
    await expect(page.getByText("2.")).toBeVisible();
    await expect(page.getByText(recipe1Name).first()).toBeVisible();
    await expect(page.getByText(recipe2Name).first()).toBeVisible();
  });

  // 4.4
  test("each recipe section has the cookbook-recipe-section CSS class", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(page, `/cookbooks/${cookbookId}/print`);
    const sections = page.locator(".cookbook-recipe-section");
    await expect(sections).toHaveCount(2);
  });

  // 4.5
  test("computed style of .cookbook-recipe-section has page-break rules", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(page, `/cookbooks/${cookbookId}/print`);
    const hasPageBreak = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules)) {
            if (
              rule instanceof CSSMediaRule &&
              rule.conditionText.includes("print")
            ) {
              for (const innerRule of Array.from(rule.cssRules)) {
                if (
                  innerRule instanceof CSSStyleRule &&
                  innerRule.selectorText === ".cookbook-recipe-section" &&
                  (innerRule.style.breakBefore === "page" ||
                    innerRule.style.pageBreakBefore === "always")
                ) {
                  return true;
                }
              }
            }
          }
        } catch {
          // cross-origin stylesheet — skip
        }
      }
      return false;
    });
    expect(hasPageBreak).toBe(true);
  });

  // 4.6
  test("no img elements are present on the print route", async ({ page }) => {
    await gotoAndWaitForHydration(page, `/cookbooks/${cookbookId}/print`);
    await expect(page.locator("img")).toHaveCount(0);
  });

  // 4.7
  test("ServingSizeAdjuster is not present in the DOM on the print route", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(page, `/cookbooks/${cookbookId}/print`);
    await expect(
      page.getByRole("button", { name: /increase servings/i }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /decrease servings/i }),
    ).toHaveCount(0);
  });

  // 4.8
  test("back link and Print button carry the print:hidden class", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(page, `/cookbooks/${cookbookId}/print`);
    const backLink = page.getByRole("link", { name: /back to cookbook/i });
    await expect(backLink).toHaveClass(/print:hidden/);
    const printBtn = page.getByRole("button", { name: /print/i });
    await expect(printBtn).toHaveClass(/print:hidden/);
  });
});

// ─── Private cookbook ─────────────────────────────────────────────────────────

// 4.2
test("unauthenticated user sees not-found state for a private cookbook print route", async ({
  page,
}) => {
  await registerAndLogin(page);
  const cookbookName = `PrivatePrint-${Date.now()}`;
  const cookbookId = await createCookbookAndGetId(page, cookbookName, false);

  await page.context().clearCookies();
  await gotoAndWaitForHydration(page, `/cookbooks/${cookbookId}/print`);
  await expect(page.getByText("Cookbook not found")).toBeVisible();
});

// ─── Cookbook detail navigation ───────────────────────────────────────────────

// 4.9
test("Print button on cookbook detail page is an <a> Link pointing to the print route URL", async ({
  page,
}) => {
  await registerAndLogin(page);
  const cookbookName = `NavPrint-${Date.now()}`;
  const cookbookId = await createCookbookAndGetId(page, cookbookName);

  const printLink = page.getByRole("link", { name: /print/i });
  await expect(printLink).toBeVisible();
  await expect(printLink).toHaveAttribute(
    "href",
    `/cookbooks/${cookbookId}/print`,
  );
});
