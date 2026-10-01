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
  // TanStack Query v5's focusManager listens for `visibilitychange` and
  // `focus` on `window` specifically — dispatching `visibilitychange` on
  // `document` never reaches that listener.
  await page.evaluate(() => {
    window.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("focus"));
  });
  try {
    if (state === "visible") {
      await expect(locator).toBeVisible({ timeout: 3000 });
    } else {
      await expect(locator).toBeHidden({ timeout: 3000 });
    }
    return;
  } catch (firstAttemptError) {
    // Headless multi-context pages don't reliably deliver a real OS-level
    // focus signal even once dispatched on the right target, so the
    // client-side cache may still not re-fetch on its own in this
    // environment. Log the original failure before falling back, so CI logs
    // can tell a headless-focus quirk apart from a genuine regression.
    console.warn(
      `waitForContextToReflect: synthetic focus dispatch didn't produce the expected state within 3s, falling back to a route reload. Original error: ${firstAttemptError}`,
    );
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForHydration(page);
  }
  if (state === "visible") {
    await expect(locator).toBeVisible({ timeout });
  } else {
    await expect(locator).toBeHidden({ timeout });
  }
}
