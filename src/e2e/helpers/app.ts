import type { Page } from "@playwright/test";

/**
 * Wait until the client app has hydrated and attached event handlers.
 */
export async function waitForHydration(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(300);
}

/**
 * Navigate to a route and wait for hydration before interacting.
 */
export async function gotoAndWaitForHydration(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
  await waitForHydration(page);
}
