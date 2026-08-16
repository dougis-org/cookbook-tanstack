import type { Page } from "@playwright/test";

/**
 * Selector for the readiness marker set by RouterIdleMarker in src/routes/__root.tsx.
 */
export const ROUTER_IDLE_SELECTOR = 'html[data-hydrated="true"]';

/** Wait until the router has settled on the currently loaded route. */
export async function waitForRouterIdle(page: Page): Promise<void> {
  await page.locator(ROUTER_IDLE_SELECTOR).waitFor({ state: "attached" });
}

/**
 * Wait until the client app has hydrated and attached event handlers.
 *
 * The #app-shell check is not redundant with the router marker: shell visibility is driven
 * by the boot-loader script off CSS load, so the app can be router-idle while still
 * display:none behind unloaded stylesheets.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  await page.locator("#app-shell").waitFor({ state: "visible" });
  await waitForRouterIdle(page);
}

/**
 * Navigate to a route and wait for hydration before interacting.
 */
export async function gotoAndWaitForHydration(page: Page, url: string) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await waitForHydration(page);
}
