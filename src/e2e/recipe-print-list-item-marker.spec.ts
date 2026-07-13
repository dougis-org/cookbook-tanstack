import type { Locator } from "@playwright/test";
import { test, expect } from "@bgotink/playwright-coverage";
import { registerAndLogin } from "./helpers/auth";
import { gotoAndWaitForHydration } from "./helpers/app";
import { submitRecipeForm, getUniqueRecipeName } from "./helpers/recipes";

/** Reads the computed style of an element's ::before pseudo-element. */
async function getBeforeMarkerStyle(locator: Locator) {
  return locator.evaluate((el) => {
    const cs = window.getComputedStyle(el, "::before");
    return {
      display: cs.display,
      width: cs.width,
      height: cs.height,
      borderRadius: cs.borderRadius,
      printColorAdjust: cs.getPropertyValue("print-color-adjust").trim(),
      webkitPrintColorAdjust: cs.getPropertyValue("-webkit-print-color-adjust").trim(),
    };
  });
}

/**
 * Different browsers support only the standard or the -webkit- prefixed
 * property, not necessarily both — assert at least one resolved to "exact"
 * rather than requiring both, so this doesn't fail on engines that only
 * implement one of the two.
 */
function expectExactColorAdjust(marker: { printColorAdjust: string; webkitPrintColorAdjust: string }) {
  expect(
    marker.printColorAdjust === "exact" || marker.webkitPrintColorAdjust === "exact",
  ).toBe(true)
}

// Covers the unify-print-list-item-styling change (#594, #595): shared
// .print-list-item marker on both the ingredient <li> and instruction <li>
// of the standalone recipe detail page. jsdom-based component tests can only
// assert class presence — they cannot evaluate @media print CSS, so this
// spec is the only coverage that proves the marker actually renders inline
// with the item text once print media is emulated in a real browser engine.
test.describe("Recipe detail print list item marker", () => {
  let recipeId: string;
  let recipeName: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerAndLogin(page);

    recipeName = getUniqueRecipeName("PrintMarkerRecipe");
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, {
      name: recipeName,
      ingredients: "Flour\nSugar",
      instructions: "Mix ingredients\nBake until golden",
    });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);
    recipeId = page.url().split("/recipes/")[1];

    await page.close();
  });

  test("instruction step text sits on the same line as its marker in print (regression: #595)", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(page, `/recipes/${recipeId}`);
    await page.emulateMedia({ media: "print" });

    const step = page.locator("li.recipe-instruction-step").first();
    // display: flex (rather than the block layout print:block would otherwise
    // produce) is what keeps the marker and step text on one line — a pixel
    // bounding-box comparison would assert the same thing less reliably
    // across font rendering / platform differences.
    await expect(step).toHaveCSS("display", "flex");

    const marker = await getBeforeMarkerStyle(step);
    expect(marker.width).toBe("5px");
    expect(marker.height).toBe("5px");
    expect(marker.borderRadius).not.toBe("0px");
    // The marker's only visible content is its background-color. Real browser
    // print output suppresses background colors by default (Chrome's print
    // dialog "Background graphics" checkbox is unchecked by default) — this
    // isn't simulated by page.emulateMedia(), so without forcing exact color
    // adjustment the marker is invisible in actual prints even though it
    // passes every other assertion in this suite. Regression: reported by
    // the user as "no delimiter at all" in real prints on multiple machines,
    // after this suite (pre-fix) was green.
    expectExactColorAdjust(marker);

    await page.emulateMedia({ media: "screen" });
  });

  test("ingredient marker renders inline with ingredient text in print", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(page, `/recipes/${recipeId}`);
    await page.emulateMedia({ media: "print" });

    const item = page.locator("li.recipe-ingredient-item").first();
    await expect(item).toHaveCSS("display", "flex");

    const marker = await getBeforeMarkerStyle(item);
    expect(marker.width).toBe("5px");
    expect(marker.height).toBe("5px");
    expect(marker.borderRadius).not.toBe("0px");
    expectExactColorAdjust(marker);

    await page.emulateMedia({ media: "screen" });
  });

  test("ingredient list stays two-column in print (container layout unaffected)", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(page, `/recipes/${recipeId}`);
    await page.emulateMedia({ media: "print" });

    const list = page.locator("ul").filter({ has: page.locator("li.recipe-ingredient-item") });
    await expect(list).toHaveCSS("column-count", "2");

    await page.emulateMedia({ media: "screen" });
  });

  test("only one marker per ingredient line (dot span hidden, ::before is the sole visible marker)", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(page, `/recipes/${recipeId}`);
    await page.emulateMedia({ media: "print" });

    const dotSpan = page.locator("li.recipe-ingredient-item span").first();
    await expect(dotSpan).toBeHidden();

    await page.emulateMedia({ media: "screen" });
  });
});
