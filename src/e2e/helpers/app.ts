import { expect, type Locator, type Page } from "@playwright/test";

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

/**
 * Wait for a second browser context's already-open page to reflect a change
 * made from a first context (e.g. owner grants/revokes a share). Brings the
 * page to the foreground and dispatches the focus/visibilitychange events
 * React Query's refetch-on-window-focus listens for, then retries the
 * supplied locator assertion.
 *
 * Headless multi-context pages don't reliably deliver a real OS-level focus
 * signal, so the synthetic-focus path above is attempted first (no
 * navigation) and, only if the state hasn't appeared within a short grace
 * period, falls back to re-requesting the current route to force a fresh
 * fetch. Either path uses a retrying Playwright expectation — never
 * `networkidle` or a fixed sleep.
 */
export async function waitForContextToReflect(
  page: Page,
  locator: Locator,
  state: "visible" | "hidden" = "visible",
  timeout = 20000,
): Promise<void> {
  await page.bringToFront();
  await page.evaluate(() => {
    window.dispatchEvent(new Event("focus"));
    document.dispatchEvent(new Event("visibilitychange"));
  });
  try {
    if (state === "visible") {
      await expect(locator).toBeVisible({ timeout: 3000 });
    } else {
      await expect(locator).toBeHidden({ timeout: 3000 });
    }
    return;
  } catch {
    // Headless multi-context pages don't reliably dispatch the OS-level focus
    // signal React Query's refetch-on-window-focus listens for, so the
    // client-side cache never re-fetches on its own in this environment.
    // Re-request the same route to force a fresh fetch, then retry the
    // assertion with the full timeout budget.
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForHydration(page);
  }
  if (state === "visible") {
    await expect(locator).toBeVisible({ timeout });
  } else {
    await expect(locator).toBeHidden({ timeout });
  }
}
