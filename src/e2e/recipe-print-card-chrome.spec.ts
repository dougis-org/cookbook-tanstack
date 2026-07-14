import type { Locator } from "@playwright/test";
import { test, expect } from "@bgotink/playwright-coverage";
import { ObjectId } from "mongodb";
import { registerAndLogin } from "./helpers/auth";
import { gotoAndWaitForHydration } from "./helpers/app";
import {
  addRecipeToCookbook,
  createCookbook,
  getUniqueCookbookName,
} from "./helpers/cookbooks";
import { withMongoDb } from "./helpers/db";
import { submitRecipeForm, getUniqueRecipeName } from "./helpers/recipes";

/**
 * Extracts every alpha value from a computed `rgba(...)`/`rgb(...)` box-shadow
 * or background-color string. Handles both legacy comma-separated syntax
 * (`rgba(0, 0, 0, 0)`) and modern CSS Color 4 space/slash syntax
 * (`rgb(0 0 0 / 0.2)`), which different browser engines can emit for the
 * same computed style.
 */
function shadowAlphaValues(value: string): number[] {
  return [...value.matchAll(/rgba?\(([^)]+)\)/g)].map((match) => {
    const parts = match[1].replace("/", ",").split(/[\s,]+/).filter(Boolean);
    return parts.length === 4 ? Number(parts[3]) : 1;
  });
}

async function expectChromeSuppressed(card: Locator) {
  await expect(async () => {
    const boxShadow = await card.evaluate((el) => window.getComputedStyle(el).boxShadow);
    expect(boxShadow === "none" || shadowAlphaValues(boxShadow).every((alpha) => alpha === 0)).toBe(true);
  }).toPass();
  await expect(card).toHaveCSS("border-radius", "0px");
  const backgroundColor = await card.evaluate((el) => window.getComputedStyle(el).backgroundColor);
  expect(shadowAlphaValues(backgroundColor).every((alpha) => alpha === 0)).toBe(true);
}

async function expectChromeVisible(card: Locator) {
  await expect(card).not.toHaveCSS("border-radius", "0px");
  const boxShadow = await card.evaluate((el) => window.getComputedStyle(el).boxShadow);
  expect(shadowAlphaValues(boxShadow).some((alpha) => alpha > 0)).toBe(true);
}

// Covers the remove-print-parchment-wrapper change (#598): RecipeDetail's
// outer card wrapper must show no background fill, rounding, or shadow when
// printed, on both the standalone recipe page and inside cookbook print.
test.describe("Recipe detail print card chrome suppression", () => {
  let recipeId: string;
  let cookbookId: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerAndLogin(page);

    const recipeName = getUniqueRecipeName("PrintChromeRecipe");
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, {
      name: recipeName,
      ingredients: "Flour\nSugar",
      instructions: "Mix and bake",
    });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);
    recipeId = page.url().split("/recipes/")[1];

    const cookbookName = getUniqueCookbookName("PrintChromeCookbook");
    const cookbook = await createCookbook(page, cookbookName);
    cookbookId = cookbook.cookbookId;
    await addRecipeToCookbook(page, recipeName);

    await page.close();
  });

  test("card chrome suppressed on standalone recipe print", async ({ page }) => {
    await gotoAndWaitForHydration(page, `/recipes/${recipeId}`);
    await page.emulateMedia({ media: "print" });

    await expectChromeSuppressed(page.locator("div.shadow-lg"));

    await page.emulateMedia({ media: "screen" });
  });

  test("card chrome visible on screen (regression guard)", async ({ page }) => {
    await gotoAndWaitForHydration(page, `/recipes/${recipeId}`);

    await expectChromeVisible(page.locator("div.shadow-lg"));
  });

  test("card chrome suppressed in cookbook print view", async ({ page }) => {
    await gotoAndWaitForHydration(
      page,
      `/cookbooks/${cookbookId}/print?displayonly=1`,
    );
    await page.emulateMedia({ media: "print" });

    const section = page.locator(".cookbook-recipe-section").first();
    await expectChromeSuppressed(section.locator("div.shadow-lg"));

    await page.emulateMedia({ media: "screen" });
  });

  test("recipe header image still renders correctly with chrome suppressed in print", async ({ page }) => {
    // Give the recipe a header image directly via the DB — the upload field
    // requires a real file POST to /api/upload, which is unrelated to what
    // this test verifies. A small, normally-proportioned (4:3) data URI PNG
    // is used so this doesn't depend on network access to an external image
    // host in CI, and doesn't distort under print.css's `img { height: auto;
    // object-fit: contain }` override the way an extreme-aspect-ratio image
    // would.
    const imageDataUri =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAeCAIAAADRv8uKAAAAK0lEQVR4nO3NMQ0AAAgDsGmafwHIQgYcTfo3056IWCwWi8VisVgsFov/xgsth36Mmzf4yAAAAABJRU5ErkJggg==";
    await withMongoDb((db) =>
      db.collection("recipes").updateOne(
        { _id: new ObjectId(recipeId) },
        { $set: { imageUrl: imageDataUri } },
      ),
    );

    await gotoAndWaitForHydration(page, `/recipes/${recipeId}`);
    await page.emulateMedia({ media: "print" });

    // print.css forces `img { height: auto; object-fit: contain }`, so in
    // print the image is no longer clipped to the fixed h-96 box — the card
    // (with rounding suppressed but overflow-hidden retained) is the actual
    // clipping boundary to check against.
    const card = page.locator("div.shadow-lg");
    const image = card.locator('[data-testid="recipe-detail-image"] img');
    await image.evaluate((img: HTMLImageElement) =>
      img.complete ? undefined : new Promise((resolve) => img.addEventListener("load", resolve, { once: true })),
    );

    const cardBox = await card.boundingBox();
    const imageBox = await image.boundingBox();
    expect(cardBox).not.toBeNull();
    expect(imageBox).not.toBeNull();
    if (cardBox && imageBox) {
      // Allow a sub-pixel tolerance for rounding in bounding-box math.
      expect(imageBox.x).toBeGreaterThanOrEqual(cardBox.x - 0.5);
      expect(imageBox.y).toBeGreaterThanOrEqual(cardBox.y - 0.5);
      expect(imageBox.x + imageBox.width).toBeLessThanOrEqual(cardBox.x + cardBox.width + 0.5);
      expect(imageBox.y + imageBox.height).toBeLessThanOrEqual(cardBox.y + cardBox.height + 0.5);
    }

    await page.emulateMedia({ media: "screen" });
  });
});
