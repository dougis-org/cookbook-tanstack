import { test, expect } from "@bgotink/playwright-coverage";
import type { Page } from "@playwright/test";
import { registerAndLogin } from "./helpers/auth";
import { createCookbookWithRecipe } from "./helpers/cookbooks";
import { waitForHydration, waitForRouterIdle } from "./helpers/app";

/**
 * Records every `data-hydrated` attribute mutation on `<html>` alongside whether `contentSelector`
 * is visible in the DOM at that instant, from before navigation through to router-idle. Installed
 * via an init script so the observer is live from the very first paint, not attached after the
 * fact where it could miss an early flip.
 *
 * This checks the actual invariant #589 was about (the marker must never claim readiness before
 * the route's real content exists) without depending on network-level interception of a specific
 * chunk request: an earlier version of this test tried to delay-and-inspect the route's lazy JS
 * chunk by name, but the current build's code-splitting/bundling behavior doesn't expose a
 * request matching any name derived from the route file — chasing that mapping made the test
 * bundler-config-fragile for no additional coverage over asserting the outcome directly.
 */
async function observeHydratedVsContent(page: Page, contentSelector: string) {
  await page.addInitScript((selector) => {
    const events: Array<{ hydrated: boolean; contentPresent: boolean }> = [];
    (window as unknown as { __hydrationEvents: typeof events }).__hydrationEvents = events;
    const setup = () => {
      // addInitScript runs before the document is parsed, so <html> doesn't exist as a Node yet;
      // retry each frame until it does rather than letting observer.observe() throw silently.
      if (!document.documentElement) {
        requestAnimationFrame(setup);
        return;
      }
      const record = () => {
        events.push({
          hydrated: document.documentElement.getAttribute("data-hydrated") === "true",
          contentPresent: document.querySelector(selector) !== null,
        });
      };
      const observer = new MutationObserver(record);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-hydrated"] });
      record();
    };
    setup();
  }, contentSelector);
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

  test("data-hydrated never claims readiness before the #589 repro route's real content is present", async ({
    page,
  }) => {
    await registerAndLogin(page);
    const { cookbookId } = await createCookbookWithRecipe(page, "HydrationMarkerRegression");

    // Use a new page sharing the same authenticated browser context (cookies carry over) so this
    // is a genuinely first-ever navigation to the toc route, not one riding on code already
    // loaded by createCookbookWithRecipe's earlier navigation through the cookbook detail view.
    const tocPage = await page.context().newPage();
    await observeHydratedVsContent(tocPage, "header h1");

    await tocPage.goto(`/cookbooks/${cookbookId}/toc`, { waitUntil: "commit" });
    await waitForRouterIdle(tocPage);
    await expect(tocPage.locator("header").getByText("Table of Contents")).toBeVisible();

    const events = await tocPage.evaluate(
      () => (window as unknown as { __hydrationEvents: Array<{ hydrated: boolean; contentPresent: boolean }> }).__hydrationEvents,
    );
    const badEvent = events.find((e) => e.hydrated && !e.contentPresent);
    expect(badEvent, "data-hydrated flipped true while the route's real content was not yet in the DOM").toBeUndefined();
    expect(events.some((e) => e.hydrated)).toBe(true);

    await tocPage.close();
  });
});
