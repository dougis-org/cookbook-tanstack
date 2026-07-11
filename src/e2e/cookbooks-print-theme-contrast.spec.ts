import { test, expect } from "@bgotink/playwright-coverage";
import { registerAndLogin } from "./helpers/auth";
import { gotoAndWaitForHydration } from "./helpers/app";
import { createCookbookWithRecipe } from "./helpers/cookbooks";

// ─── Background contrast across all themes (issue #564) ───────────────────────
//
// The TOC/print preview background is intentionally paired with the always-light
// --theme-print-* text tokens (see CookbookStandalonePage), so it must render as
// light regardless of the active site theme. These tests toggle each theme and
// verify both the background color and text-vs-background contrast.

function relativeLuminance(rgb: string): number {
  const match = rgb.match(/\d+/g);
  if (!match) return -1;
  const [r, g, b] = match.map(Number);
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

// WCAG 2.x contrast ratio: https://www.w3.org/TR/WCAG21/#contrast-minimum
function contrastRatio(rgbA: string, rgbB: string): number {
  const lA = relativeLuminance(rgbA);
  const lB = relativeLuminance(rgbB);
  const [lighter, darker] = lA >= lB ? [lA, lB] : [lB, lA];
  return (lighter + 0.05) / (darker + 0.05);
}

// WCAG AA minimum contrast ratio for normal-size text.
const WCAG_AA_NORMAL_TEXT_MIN_CONTRAST = 4.5;

const SUPPORTED_THEMES = ["dark", "dark-greens", "light-cool", "light-warm"] as const;

test.describe("TOC/print preview background contrast across themes", () => {
  let cookbookId: string;
  let cookbookName: string;
  let expectedBackgroundColor: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerAndLogin(page);
    const created = await createCookbookWithRecipe(page, "ThemeContrast");
    cookbookId = created.cookbookId;
    cookbookName = created.cookbookName;

    await gotoAndWaitForHydration(page, `/cookbooks/${cookbookId}/toc`);
    expectedBackgroundColor = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.backgroundColor = "var(--theme-print-bg)";
      document.body.appendChild(probe);
      const resolved = window.getComputedStyle(probe).backgroundColor;
      probe.remove();
      return resolved;
    });

    await page.close();
  });

  for (const theme of SUPPORTED_THEMES) {
    for (const routeSuffix of [
      "toc",
      "print",
      "print?displayonly=1",
    ] as const) {
      test(`${routeSuffix} renders a light background with visible text in the ${theme} theme`, async ({
        page,
      }) => {
        await page.addInitScript((t) => {
          localStorage.setItem("cookbook-theme", t);
        }, theme);

        // The bare "print" route (without displayonly=1) triggers window.print()
        // in CookbookPrintPage. Stub it (same pattern as cookbooks-print-behavior.spec.ts)
        // so the dialog side effect doesn't hang/flake this assertion.
        await page.addInitScript(() => {
          window.print = () => {};
        });

        await gotoAndWaitForHydration(page, `/cookbooks/${cookbookId}/${routeSuffix}`);
        await expect(page.locator(`html.${theme}`)).toBeVisible();

        // Both routes render CookbookPageHeader (the cookbook title) via the shared
        // CookbookStandalonePage wrapper this fix targets. The /print route also
        // renders each recipe's own <h1> further down via RecipeDetail, which is
        // explicitly out of scope for this fix and uses its own (already-correct)
        // styling, so target the cookbook title heading specifically here.
        const titleLocator = page.getByRole("heading", { level: 1, name: cookbookName });
        await expect(titleLocator).toBeVisible();

        const { backgroundColor, textColor } = await titleLocator.evaluate((el) => {
          let node: HTMLElement | null = el as HTMLElement;
          let bg = "";
          while (node) {
            const computed = window.getComputedStyle(node).backgroundColor;
            if (computed && computed !== "rgba(0, 0, 0, 0)" && computed !== "transparent") {
              bg = computed;
              break;
            }
            node = node.parentElement;
          }
          return {
            backgroundColor: bg,
            textColor: window.getComputedStyle(el).color,
          };
        });

        expect(backgroundColor).toBe(expectedBackgroundColor);
        expect(contrastRatio(backgroundColor, textColor)).toBeGreaterThanOrEqual(
          WCAG_AA_NORMAL_TEXT_MIN_CONTRAST,
        );
      });
    }
  }
});
