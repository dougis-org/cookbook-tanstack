import { test, expect } from "@bgotink/playwright-coverage";
import { ObjectId } from "mongodb";
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

// Covers cookbook print (#699, PR 3): header items, footer items and #N per
// recipe, with the footer row inside its recipe section and never split.
// Playwright cannot apply the `@page cookbook-page` margins to a screen
// viewport, so "no clipping" is asserted as: the row is fully inside its
// recipe section box, its content is not overflowing, and break-inside is avoid.
test.describe("Cookbook print shows header, footer and #N per recipe", () => {
  let cookbookId: string;
  let email: string;
  let password: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const creds = await registerAndLogin(page);
    email = creds.email;
    password = creds.password;

    const recipeNames: string[] = [];
    for (const label of ["CbPlacementA", "CbPlacementB"]) {
      const name = getUniqueRecipeName(label);
      recipeNames.push(name);
      await gotoAndWaitForHydration(page, "/recipes/new");
      await submitRecipeForm(page, {
        name,
        ingredients: "Flour",
        instructions: "Mix",
        prepTime: "15",
        servings: "4",
        category: "Desserts",
      });
      await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);
    }

    const cookbook = await createCookbook(page, getUniqueCookbookName("CbPlacement"));
    cookbookId = cookbook.cookbookId;
    for (const name of recipeNames) {
      await addRecipeToCookbook(page, name);
    }

    await withMongoDb((db) =>
      db.collection("user").updateOne(
        { email },
        {
          $set: {
            printCategory: "footer",
            printPrepTime: "header",
            printServings: "footer",
            printCookTime: "none",
            printDifficulty: "none",
          },
        },
      ),
    );
    await page.close();
  });

  test("each recipe prints header items, footer items and its #N without clipping", async ({ page }) => {
    await login(page, email, password);
    await gotoAndWaitForHydration(page, `/cookbooks/${cookbookId}/print?displayonly=1`);
    await page.emulateMedia({ media: "print" });

    const sections = page.locator(".cookbook-recipe-section");
    await expect(sections).toHaveCount(2);

    for (let i = 0; i < 2; i++) {
      const section = sections.nth(i);
      const header = section.getByTestId("print-meta-line");
      const footer = section.getByTestId("print-footer-row");

      await expect(header).toContainText("Prep: 15m");
      await expect(footer).toHaveCount(1);
      await expect(footer).toBeVisible();
      await expect(footer).toContainText("Serves: 4");
      await expect(footer).toContainText("Desserts");
      await expect(footer.getByTestId("cookbook-recipe-position-label")).toHaveText(`#${i + 1}`);
      await expect(footer).toHaveCSS("break-inside", "avoid");

      const sectionBox = await section.boundingBox();
      const footerBox = await footer.boundingBox();
      expect(sectionBox).not.toBeNull();
      expect(footerBox).not.toBeNull();
      expect(footerBox!.x).toBeGreaterThanOrEqual(sectionBox!.x - 1);
      expect(footerBox!.x + footerBox!.width).toBeLessThanOrEqual(sectionBox!.x + sectionBox!.width + 1);
      expect(footerBox!.y + footerBox!.height).toBeLessThanOrEqual(sectionBox!.y + sectionBox!.height + 1);
      const overflows = await footer.evaluate((el) => el.scrollWidth > el.clientWidth);
      expect(overflows).toBe(false);
    }
  });
});

// "Added by" is attribution and stays independent of placements (#699).
test.describe("Added by prints in a collaborative cookbook with every element none", () => {
  let cookbookId: string;
  let email: string;
  let password: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const creds = await registerAndLogin(page, { name: "Olive Owner" });
    email = creds.email;
    password = creds.password;

    const recipeName = getUniqueRecipeName("AddedByRecipe");
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, {
      name: recipeName,
      ingredients: "Flour",
      instructions: "Mix",
      prepTime: "15",
    });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    const cookbook = await createCookbook(page, getUniqueCookbookName("AddedByCookbook"));
    cookbookId = cookbook.cookbookId;
    await addRecipeToCookbook(page, recipeName);

    const collab = await browser.newPage();
    const collabCreds = await registerAndLogin(collab, { name: "Colin Collab" });
    await collab.close();

    await withMongoDb(async (db) => {
      const owner = await db.collection("user").findOne({ email });
      const collabUser = await db.collection("user").findOne({ email: collabCreds.email });
      await db.collection("collaborators").insertOne({
        cookbookId: new ObjectId(cookbookId),
        userId: collabUser!._id,
        role: "viewer",
        addedAt: new Date(),
        addedBy: owner!._id,
        onboarded: true,
      });
      await db.collection("user").updateOne(
        { email },
        {
          $set: {
            printCategory: "none",
            printPrepTime: "none",
            printServings: "none",
            printCookTime: "none",
            printDifficulty: "none",
          },
        },
      );
    });
    await page.close();
  });

  test("header line holds only Added by and footer holds only #N", async ({ page }) => {
    await login(page, email, password);
    await gotoAndWaitForHydration(page, `/cookbooks/${cookbookId}/print?displayonly=1`);
    await page.emulateMedia({ media: "print" });

    const section = page.locator(".cookbook-recipe-section").first();
    await expect(section.getByTestId("print-meta-line")).toHaveText("Added by: Olive Owner");
    const footer = section.getByTestId("print-footer-row");
    await expect(footer).toHaveText("#1");
    await expect(footer.getByTestId("print-footer-items")).toHaveCount(0);
  });
});

// Legacy user (printShowMeta false, none of the new fields) keeps meta hidden (#699).
test.describe("Legacy user with printShowMeta false prints no meta line", () => {
  let cookbookId: string;
  let email: string;
  let password: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const creds = await registerAndLogin(page);
    email = creds.email;
    password = creds.password;

    const recipeName = getUniqueRecipeName("LegacyRecipe");
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, {
      name: recipeName,
      ingredients: "Flour",
      instructions: "Mix",
      prepTime: "15",
      servings: "4",
    });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    const cookbook = await createCookbook(page, getUniqueCookbookName("LegacyCookbook"));
    cookbookId = cookbook.cookbookId;
    await addRecipeToCookbook(page, recipeName);

    await withMongoDb((db) =>
      db.collection("user").updateOne(
        { email },
        {
          $set: { printShowMeta: false },
          $unset: {
            printCategory: "",
            printDifficulty: "",
            printServings: "",
            printPrepTime: "",
            printCookTime: "",
          },
        },
      ),
    );
    await page.close();
  });

  test("no meta line in cookbook print; #N still printed", async ({ page }) => {
    await login(page, email, password);
    await gotoAndWaitForHydration(page, `/cookbooks/${cookbookId}/print?displayonly=1`);
    await page.emulateMedia({ media: "print" });

    const section = page.locator(".cookbook-recipe-section").first();
    await expect(section.getByTestId("cookbook-recipe-position-label")).toHaveText("#1");
    await expect(section.getByTestId("print-meta-line")).toHaveCount(0);
  });
});

// Legacy user with meta shown (no new fields, printShowMeta absent): the four
// meta items stay in the header; Category is the one addition, in the footer (#699).
test.describe("Legacy user with meta shown keeps header items and gains Category in footer", () => {
  let cookbookId: string;
  let email: string;
  let password: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const creds = await registerAndLogin(page);
    email = creds.email;
    password = creds.password;

    const recipeName = getUniqueRecipeName("LegacyShownRecipe");
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, {
      name: recipeName,
      ingredients: "Flour",
      instructions: "Mix",
      prepTime: "15",
      servings: "4",
      category: "Desserts",
    });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    const cookbook = await createCookbook(page, getUniqueCookbookName("LegacyShownCookbook"));
    cookbookId = cookbook.cookbookId;
    await addRecipeToCookbook(page, recipeName);

    await withMongoDb((db) =>
      db.collection("user").updateOne(
        { email },
        {
          $unset: {
            printShowMeta: "",
            printCategory: "",
            printDifficulty: "",
            printServings: "",
            printPrepTime: "",
            printCookTime: "",
          },
        },
      ),
    );
    await page.close();
  });

  test("header has Prep and Serves; footer has Category and #N", async ({ page }) => {
    await login(page, email, password);
    await gotoAndWaitForHydration(page, `/cookbooks/${cookbookId}/print?displayonly=1`);
    await page.emulateMedia({ media: "print" });

    const section = page.locator(".cookbook-recipe-section").first();
    const header = section.getByTestId("print-meta-line");
    await expect(header).toContainText("Prep: 15m");
    await expect(header).toContainText("Serves: 4");
    await expect(header).not.toContainText("Desserts");
    const footer = section.getByTestId("print-footer-row");
    await expect(footer).toContainText("Desserts");
    await expect(footer.getByTestId("cookbook-recipe-position-label")).toHaveText("#1");
  });
});
