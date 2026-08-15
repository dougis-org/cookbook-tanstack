import { test, expect } from "@bgotink/playwright-coverage";
import type { Page } from "@playwright/test";
import { registerAndLogin } from "./helpers/auth";
import { createCookbookWithRecipe } from "./helpers/cookbooks";
import { waitForHydration, waitForRouterIdle } from "./helpers/app";

/**
 * Delays the route-chunk request matching `urlSignature` so a route transition can be
 * observed mid-flight. Mirrors the CSS-delay pattern in fouc-prevention.spec.ts but targets
 * the route's lazy-loaded module, since #589's root cause was route-level code-splitting
 * racing the (CSS-only) boot-loader readiness gate. Matching by URL signature (not "first
 * script request") avoids delaying the client entry bundle instead of the route chunk itself.
 * `release()` is safe to call more than once and must be called even if the caller throws,
 * or the intercepted request is left parked and the test hangs at teardown.
 */
async function delayRouteChunkRequest(page: Page, urlSignature: string) {
  let releaseRequest!: () => void;
  const released = new Promise<void>((resolve) => {
    releaseRequest = resolve;
  });
  let resolveRequested!: (url: string) => void;
  const requested = new Promise<string>((resolve) => {
    resolveRequested = resolve;
  });
  let intercepted = false;

  await page.route("**/*", async (route) => {
    const request = route.request();

    if (!intercepted && request.resourceType() === "script" && request.url().includes(urlSignature)) {
      intercepted = true;
      resolveRequested(request.url());
      await released;
    }
    await route.continue();
  });

  return {
    requested,
    release: releaseRequest,
  };
}

test.describe("Hydration/route-idle marker", () => {
  test("data-hydrated is absent from the SSR response and present once the router reaches idle on first load", async ({
    page,
  }) => {
    // Asserting against the SSR HTML body (rather than page.evaluate after `waitUntil: "commit"`)
    // avoids a time-of-check race against the client hydration effect, which can run before the
    // evaluate call lands.
    const response = await page.request.get("/");
    const html = await response.text();
    expect(html).not.toContain('data-hydrated="true"');

    await page.goto("/");
    await waitForRouterIdle(page);

    const hydratedAttr = await page.evaluate(() =>
      document.documentElement.getAttribute("data-hydrated"),
    );
    expect(hydratedAttr).toBe("true");
  });

  test("data-hydrated is removed while a client-side navigation is pending and re-set once idle", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForHydration(page);
    await expect(page.locator("html")).toHaveAttribute("data-hydrated", "true");

    // Observe every data-hydrated mutation via MutationObserver rather than polling on
    // requestAnimationFrame: a poll can straddle a fast pending→idle transition and miss the
    // intermediate "null" state entirely, since it only samples at frame boundaries.
    // MutationObserver fires for every actual attribute change, so it can't miss one.
    const eventsPromise = page.evaluate(() => {
      return new Promise<string[]>((resolve) => {
        const events: string[] = [document.documentElement.getAttribute("data-hydrated") ?? "null"];
        const observer = new MutationObserver(() => {
          const value = document.documentElement.getAttribute("data-hydrated") ?? "null";
          events.push(value);
          if (events.includes("null") && value === "true") {
            observer.disconnect();
            resolve(events);
          }
        });
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["data-hydrated"],
        });
        // Safety net so the test fails with a clear assertion instead of hanging if the
        // marker never re-arms.
        setTimeout(() => {
          observer.disconnect();
          resolve(events);
        }, 10000);
      });
    });

    await page.getByRole("link", { name: "Browse Public Recipes" }).click();
    const events = await eventsPromise;

    expect(events).toContain("null");
    expect(events[events.length - 1]).toBe("true");
    await expect(page).toHaveURL(/\/recipes/);
  });

  test("data-hydrated does not settle until the #589 repro route's lazy chunk resolves, not merely once #app-shell is visible", async ({
    page,
  }) => {
    await registerAndLogin(page);
    const { cookbookId } = await createCookbookWithRecipe(page, "HydrationMarkerRegression");

    const { requested, release } = await delayRouteChunkRequest(page, "cookbooks.$cookbookId_.toc");

    try {
      await page.goto(`/cookbooks/${cookbookId}/toc`, { waitUntil: "commit" });
      await requested;

      // #app-shell can already be visible (CSS is unaffected by the JS-chunk delay above) while
      // the route's lazy module — and therefore the marker — must still be pending.
      await expect(page.locator("#app-shell")).toBeVisible();
      const hydratedWhileChunkPending = await page.evaluate(() =>
        document.documentElement.getAttribute("data-hydrated"),
      );
      expect(hydratedWhileChunkPending).toBeNull();
    } finally {
      release();
    }

    await waitForRouterIdle(page);
    await expect(page.locator("header").getByText("Table of Contents")).toBeVisible();
  });
});
