import { test, expect } from "@bgotink/playwright-coverage";
import { login, registerAndLogin } from "./helpers/auth";
import { gotoAndWaitForHydration } from "./helpers/app";
import {
  addRecipeToCookbook,
  createCookbook,
  getUniqueCookbookName,
} from "./helpers/cookbooks";
import { withMongoDb } from "./helpers/db";
import { submitRecipeForm, getUniqueRecipeName } from "./helpers/recipes";

// Covers the print-preferences change (#597): a user with a print preference
// turned off must have the corresponding section absent from print output,
// on both the single-recipe print view and the cookbook print view.
test.describe("Print preferences suppress sections from print output", () => {
  let recipeId: string;
  let cookbookId: string;
  let email: string;
  let password: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const creds = await registerAndLogin(page);
    email = creds.email;
    password = creds.password;

    const recipeName = getUniqueRecipeName("PrintPrefsRecipe");
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, {
      name: recipeName,
      ingredients: "Flour\nSugar",
      instructions: "Mix and bake",
    });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);
    recipeId = page.url().split("/recipes/")[1];

    const cookbookName = getUniqueCookbookName("PrintPrefsCookbook");
    const cookbook = await createCookbook(page, cookbookName);
    cookbookId = cookbook.cookbookId;
    await addRecipeToCookbook(page, recipeName);

    await withMongoDb((db) =>
      db.collection("user").updateOne({ email }, { $set: { printShowInstructions: false } }),
    );

    await page.close();
  });

  test("suppressed section absent from print DOM on single-recipe print view", async ({ page }) => {
    await login(page, email, password);
    await gotoAndWaitForHydration(page, `/recipes/${recipeId}`);
    await page.emulateMedia({ media: "print" });

    const heading = page.getByRole("heading", { name: "Instructions" });
    await expect(heading).toBeHidden();

    await page.emulateMedia({ media: "screen" });
    await expect(heading).toBeVisible();
  });

  test("suppressed section absent from print DOM on cookbook print view", async ({ page }) => {
    await login(page, email, password);
    await gotoAndWaitForHydration(page, `/cookbooks/${cookbookId}/print?displayonly=1`);
    await page.emulateMedia({ media: "print" });

    const section = page.locator(".cookbook-recipe-section").first();
    const heading = section.getByRole("heading", { name: "Instructions" });
    await expect(heading).toBeHidden();

    await page.emulateMedia({ media: "screen" });
    await expect(heading).toBeVisible();
  });
});

// Covers per-element header/footer placement (#699): Prep in the header,
// Category in the footer, both print-only.
test.describe("Print placement puts elements in header line and footer row", () => {
  let recipeId: string;
  let email: string;
  let password: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const creds = await registerAndLogin(page);
    email = creds.email;
    password = creds.password;

    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, {
      name: getUniqueRecipeName("PlacementRecipe"),
      ingredients: "Flour",
      instructions: "Mix",
      prepTime: "15",
      category: "Desserts",
    });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);
    recipeId = page.url().split("/recipes/")[1];

    await withMongoDb((db) =>
      db.collection("user").updateOne(
        { email },
        {
          $set: {
            printCategory: "footer",
            printPrepTime: "header",
            printServings: "none",
            printCookTime: "none",
            printDifficulty: "none",
          },
        },
      ),
    );
    await page.close();
  });

  test("print shows Prep in header and category in footer; screen shows neither extra element", async ({ page }) => {
    await login(page, email, password);
    await gotoAndWaitForHydration(page, `/recipes/${recipeId}`);

    const header = page.getByTestId("print-meta-line");
    const footer = page.getByTestId("print-footer-row");

    await page.emulateMedia({ media: "print" });
    await expect(header).toBeVisible();
    await expect(header).toContainText("Prep: 15m");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText("Desserts");

    await page.emulateMedia({ media: "screen" });
    await expect(header).toBeHidden();
    await expect(footer).toBeHidden();
  });
});
