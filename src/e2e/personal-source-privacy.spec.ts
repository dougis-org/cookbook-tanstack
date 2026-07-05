import { test, expect } from "@bgotink/playwright-coverage";
import type { Page } from "@playwright/test";
import { registerAndLogin, login } from "./helpers/auth";
import { gotoAndWaitForHydration } from "./helpers/app";
import {
  getUniqueRecipeName,
  selectPersonalSource,
  clickPersonalSourceOption,
} from "./helpers/recipes";

const PERSONAL_NAME = "Aunt Mary";

// tRPC batch GET format (decoded): /api/trpc/recipes.byId?batch=1&input={"0":{"json":{"id":"..."}}}
// The actual request URL-encodes the input parameter via encodeURIComponent.
// Uses page.request, which inherits the page's current auth cookies — call under the
// intended session (owner, cross-user, or unauthenticated) to exercise the right code path.
async function assertPersonalNameNotInResponse(page: Page, recipeId: string) {
  const input = encodeURIComponent(JSON.stringify({ "0": { json: { id: recipeId } } }));
  const response = await page.request.get(`/api/trpc/recipes.byId?batch=1&input=${input}`);
  const body = await response.text();
  expect(
    response.ok(),
    `recipes.byId request for recipe ${recipeId} failed with HTTP ${response.status()}. Body: ${body}`,
  ).toBe(true);
  let json: Array<{ result?: unknown; error?: unknown }>;
  try {
    json = JSON.parse(body) as Array<{ result?: unknown; error?: unknown }>;
  } catch {
    throw new Error(
      `recipes.byId response for recipe ${recipeId} was not valid JSON.\n` +
        `Body (first 500 chars): ${body.slice(0, 500)}`,
    );
  }
  expect(
    json[0]?.error,
    `tRPC returned an error for recipe ${recipeId}: ${JSON.stringify(json[0]?.error)}`,
  ).toBeUndefined();
  expect(body, `Privacy leak: "${PERSONAL_NAME}" was present in recipes.byId response for recipe ${recipeId}`).not.toContain(PERSONAL_NAME);
}

test.describe("Personal source privacy", () => {
  let recipeId: string;
  let recipeUrl: string;
  let userACreds: { email: string; password: string };

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    userACreds = await registerAndLogin(page);

    await gotoAndWaitForHydration(page, "/recipes/new");
    await page.getByLabel("Recipe Name").waitFor({ state: "visible" });
    await page.getByLabel("Recipe Name").fill(getUniqueRecipeName("Personal Privacy"));
    await selectPersonalSource(page, PERSONAL_NAME);
    await page.getByRole("button", { name: /Create Recipe/ }).click();
    await page.waitForURL(/\/recipes\/[a-f0-9]+$/);

    recipeUrl = page.url();
    const extractedId = recipeUrl.split("/").pop();
    if (!extractedId?.match(/^[a-f0-9]{24}$/)) {
      throw new Error(`Expected a 24-char hex recipe ID at the end of "${recipeUrl}" but got "${extractedId}"`);
    }
    recipeId = extractedId;
  });

  test("owner happy path", async ({ page }) => {
    await gotoAndWaitForHydration(page, recipeUrl);
    await expect(page.getByText(new RegExp(`Personal.*·.*${PERSONAL_NAME}`))).toBeVisible();
  });

  test("cross-user privacy (DOM + network)", async ({ page }) => {
    await page.context().clearCookies();
    await registerAndLogin(page, { name: "User B" });
    await gotoAndWaitForHydration(page, recipeUrl);

    await expect(page.getByText(/Source:.*Personal/)).toBeVisible();
    await expect(page.getByText(PERSONAL_NAME)).not.toBeAttached();
    await assertPersonalNameNotInResponse(page, recipeId);
  });

  test("unauthenticated privacy (DOM + network)", async ({ page }) => {
    await page.context().clearCookies();
    await gotoAndWaitForHydration(page, recipeUrl);

    await expect(page.getByText(/Source:.*Personal/)).toBeVisible();
    await expect(page.getByText(PERSONAL_NAME)).not.toBeAttached();
    await assertPersonalNameNotInResponse(page, recipeId);
  });

  test("source switch clears", async ({ page }) => {
    await login(page, userACreds.email, userACreds.password);
    await gotoAndWaitForHydration(page, `/recipes/${recipeId}/edit`);

    // Clear the Personal source and select a non-Personal one
    await page.locator("#sourceId").getByRole("button").click();
    const altSourceName = `Alt Source ${Date.now()}`;
    const altResponsePromise = page.waitForResponse(/\/api\/trpc\/sources\.search/);
    await page.getByPlaceholder("Search for a source...").fill(altSourceName);
    const altSearchResponse = await altResponsePromise;
    if (!altSearchResponse.ok()) {
      throw new Error(
        `sources.search failed (${altSearchResponse.status()}) while searching for "${altSourceName}". Body: ${await altSearchResponse.text()}`,
      );
    }
    await page.getByRole("button", { name: new RegExp(`Create "${altSourceName}"`) }).click();
    // Wait until the SourceSelector reflects the new source (create mutation + onSuccess complete)
    // before saving — otherwise the form submits with sourceId: undefined and the server keeps
    // personalSourceName unchanged (because it falls back to the still-Personal stored sourceId).
    await expect(page.locator("#sourceId")).toContainText(altSourceName, { timeout: 5000 });
    await page.getByRole("button", { name: /Update Recipe/ }).click();
    await page.waitForURL(/\/recipes\/[a-f0-9]+$/);
    // Confirm the server cleared personalSourceName before navigating to the edit form.
    // This makes the server-enforcement guarantee explicit and prevents the test from
    // passing due to stale React Query cache rather than actual server state.
    await assertPersonalNameNotInResponse(page, recipeId);

    await gotoAndWaitForHydration(page, `/recipes/${recipeId}/edit`);
    await page.locator("#sourceId").getByRole("button").click();
    await clickPersonalSourceOption(page);

    await expect(page.getByLabel("Personal Name")).toHaveValue("");
  });

  test("selector conditional", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/recipes/new");

    await expect(page.getByLabel("Personal Name")).not.toBeVisible();

    await selectPersonalSource(page, "");

    await expect(page.getByLabel("Personal Name")).toBeVisible();

    await page.locator("#sourceId").getByRole("button").click();

    await expect(page.getByLabel("Personal Name")).not.toBeVisible();
  });
});
