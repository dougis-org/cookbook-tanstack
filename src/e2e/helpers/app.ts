import type { Page } from "@playwright/test";

/**
 * Wait until the client app has hydrated and attached event handlers.
 */
export async function waitForHydration(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.locator("#app-shell").waitFor({ state: "visible" });
  try {
    await page.waitForLoadState("networkidle", { timeout: 5000 });
  } catch {
    // Some routes keep background requests open; visibility plus a short settle
    // still avoids interacting during the initial React hydration pass.
  }
  await page.waitForTimeout(100);
}

/**
 * Navigate to a route and wait for hydration before interacting.
 */
export async function gotoAndWaitForHydration(page: Page, url: string) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await waitForHydration(page);
}
