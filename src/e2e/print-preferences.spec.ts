import { test, expect } from "@bgotink/playwright-coverage";
import type { Browser, Page } from "@playwright/test";
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

const EMAIL_PATTERN = /^[^\s@$]+@[^\s@$]+\.[^\s@$]+$/;

// Query-boundary check: only plain email strings reach a Mongo filter.
function assertEmail(value: unknown): string {
  if (typeof value !== "string" || !EMAIL_PATTERN.test(value)) {
    throw new Error("Expected a plain email string for the Mongo filter");
  }
  return value;
}

async function findUserByEmail(email: string) {
  const safeEmail = assertEmail(email);
  return withMongoDb((db) => db.collection("user").findOne({ email: { $eq: safeEmail } }));
}

async function updateUserByEmail(
  email: string,
  update: { $set?: Record<string, unknown>; $unset?: Record<string, ""> },
) {
  const safeEmail = assertEmail(email);
  await withMongoDb((db) => db.collection("user").updateOne({ email: { $eq: safeEmail } }, update));
}

const PLACEMENT_KEYS = [
  "printCategory",
  "printDifficulty",
  "printServings",
  "printPrepTime",
  "printCookTime",
] as const;

const ALL_NONE = Object.fromEntries(PLACEMENT_KEYS.map((k) => [k, "none"]));
const UNSET_PLACEMENTS = Object.fromEntries(PLACEMENT_KEYS.map((k) => [k, ""])) as Record<string, "">;

// Registers a user, creates one recipe per label and a cookbook holding them all.
async function seedCookbook(
  browser: Browser,
  opts: { userName?: string; labels: string[]; recipe: Record<string, string> },
) {
  const page = await browser.newPage();
  const { email, password } = await registerAndLogin(page, { name: opts.userName });
  const recipeNames: string[] = [];
  for (const label of opts.labels) {
    const name = getUniqueRecipeName(label);
    recipeNames.push(name);
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, { name, ingredients: "Flour", instructions: "Mix", ...opts.recipe });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);
  }
  const { cookbookId } = await createCookbook(page, getUniqueCookbookName(opts.labels[0]));
  for (const name of recipeNames) {
    await addRecipeToCookbook(page, name);
  }
  await page.close();
  return { email, password, cookbookId };
}

async function openCookbookPrint(page: Page, creds: { email: string; password: string }, cookbookId: string) {
  await login(page, creds.email, creds.password);
  await gotoAndWaitForHydration(page, `/cookbooks/${cookbookId}/print?displayonly=1`);
  await page.emulateMedia({ media: "print" });
  return page.locator(".cookbook-recipe-section");
}

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

    await updateUserByEmail(email, { $set: { printShowInstructions: false } });

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

    await updateUserByEmail(email, {
      $set: { ...ALL_NONE, printCategory: "footer", printPrepTime: "header" },
    });
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
  let creds: { email: string; password: string };
  let cookbookId: string;

  test.beforeAll(async ({ browser }) => {
    const seeded = await seedCookbook(browser, {
      labels: ["CbPlacementA", "CbPlacementB"],
      recipe: { prepTime: "15", servings: "4", category: "Desserts" },
    });
    ({ cookbookId } = seeded);
    creds = seeded;
    await updateUserByEmail(creds.email, {
      $set: { ...ALL_NONE, printCategory: "footer", printPrepTime: "header", printServings: "footer" },
    });
  });

  test("each recipe prints header items, footer items and its #N without clipping", async ({ page }) => {
    const sections = await openCookbookPrint(page, creds, cookbookId);
    await expect(sections).toHaveCount(2);

    for (let i = 0; i < 2; i++) {
      const section = sections.nth(i);
      const footer = section.getByTestId("print-footer-row");

      await expect(section.getByTestId("print-meta-line")).toContainText("Prep: 15m");
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
      expect(await footer.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(false);
    }
  });
});

// "Added by" is attribution and stays independent of placements (#699).
test.describe("Added by prints in a collaborative cookbook with every element none", () => {
  let creds: { email: string; password: string };
  let cookbookId: string;

  test.beforeAll(async ({ browser }) => {
    const seeded = await seedCookbook(browser, {
      userName: "Olive Owner",
      labels: ["AddedBy"],
      recipe: { prepTime: "15" },
    });
    ({ cookbookId } = seeded);
    creds = seeded;

    const collab = await browser.newPage();
    const collabCreds = await registerAndLogin(collab, { name: "Colin Collab" });
    await collab.close();

    const owner = await findUserByEmail(creds.email);
    const collabUser = await findUserByEmail(collabCreds.email);
    await withMongoDb((db) =>
      db.collection("collaborators").insertOne({
        cookbookId: new ObjectId(cookbookId),
        userId: collabUser!._id,
        role: "viewer",
        addedAt: new Date(),
        addedBy: owner!._id,
        onboarded: true,
      }),
    );
    await updateUserByEmail(creds.email, { $set: ALL_NONE });
  });

  test("header line holds only Added by and footer holds only #N", async ({ page }) => {
    const section = (await openCookbookPrint(page, creds, cookbookId)).first();
    await expect(section.getByTestId("print-meta-line")).toHaveText("Added by: Olive Owner");
    const footer = section.getByTestId("print-footer-row");
    await expect(footer).toHaveText("#1");
    await expect(footer.getByTestId("print-footer-items")).toHaveCount(0);
  });
});

// Legacy users have none of the new placement fields (#699).
test.describe("Legacy users keep their header items", () => {
  const recipe = { prepTime: "15", servings: "4", category: "Desserts" };
  let hidden: { email: string; password: string; cookbookId: string };
  let shown: { email: string; password: string; cookbookId: string };

  test.beforeAll(async ({ browser }) => {
    hidden = await seedCookbook(browser, { labels: ["LegacyHidden"], recipe });
    await updateUserByEmail(hidden.email, { $set: { printShowMeta: false }, $unset: UNSET_PLACEMENTS });
    shown = await seedCookbook(browser, { labels: ["LegacyShown"], recipe });
    await updateUserByEmail(shown.email, { $unset: { ...UNSET_PLACEMENTS, printShowMeta: "" } });
  });

  test("printShowMeta false: no meta line, #N still printed", async ({ page }) => {
    const section = (await openCookbookPrint(page, hidden, hidden.cookbookId)).first();
    await expect(section.getByTestId("cookbook-recipe-position-label")).toHaveText("#1");
    await expect(section.getByTestId("print-meta-line")).toHaveCount(0);
  });

  test("meta shown: header has Prep and Serves; footer has Category and #N", async ({ page }) => {
    const section = (await openCookbookPrint(page, shown, shown.cookbookId)).first();
    const header = section.getByTestId("print-meta-line");
    await expect(header).toContainText("Prep: 15m");
    await expect(header).toContainText("Serves: 4");
    await expect(header).not.toContainText("Desserts");
    const footer = section.getByTestId("print-footer-row");
    await expect(footer).toContainText("Desserts");
    await expect(footer.getByTestId("cookbook-recipe-position-label")).toHaveText("#1");
  });
});
