import { test, expect } from "@bgotink/playwright-coverage";
import type { Page } from "@playwright/test";
import { registerAndLogin, login } from "./helpers/auth";
import { gotoAndWaitForHydration } from "./helpers/app";
import {
  getUniqueRecipeName,
  selectPersonalSource,
} from "./helpers/recipes";

// tRPC batch GET format: /api/trpc/recipes.byId?batch=1&input={"0":{"json":{"id":"..."}}}
async function assertPersonalNameNotInResponse(page: Page, recipeId: string) {
  const input = encodeURIComponent(JSON.stringify({ "0": { json: { id: recipeId } } }));
  const response = await page.request.get(`/api/trpc/recipes.byId?batch=1&input=${input}`);
  expect(response.ok()).toBe(true);
  expect(await response.text()).not.toContain("Aunt Mary");
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
    await selectPersonalSource(page, "Aunt Mary");
    await page.getByRole("button", { name: /Create Recipe/ }).click();
    await page.waitForURL(/\/recipes\/[a-f0-9]+$/);

    recipeUrl = page.url();
    recipeId = recipeUrl.split("/").pop()!;
  });

  test("owner happy path", async ({ page }) => {
    await gotoAndWaitForHydration(page, recipeUrl);
    await expect(page.getByText(/Personal.*·.*Aunt Mary/)).toBeVisible();
  });

  test("cross-user privacy (DOM + network)", async ({ page }) => {
    await page.context().clearCookies();
    await registerAndLogin(page, { name: "User B" });
    await gotoAndWaitForHydration(page, recipeUrl);

    await expect(page.getByText(/Source:.*Personal/)).toBeVisible();
    await expect(page.getByText("Aunt Mary")).not.toBeVisible();
    await assertPersonalNameNotInResponse(page, recipeId);
  });

  test("unauthenticated privacy (DOM + network)", async ({ page }) => {
    await page.context().clearCookies();
    await gotoAndWaitForHydration(page, recipeUrl);

    await expect(page.getByText(/Source:.*Personal/)).toBeVisible();
    await expect(page.getByText("Aunt Mary")).not.toBeVisible();
    await assertPersonalNameNotInResponse(page, recipeId);
  });

  test("source switch clears", async ({ page }) => {
    await login(page, userACreds.email, userACreds.password);
    await gotoAndWaitForHydration(page, `/recipes/${recipeId}/edit`);

    // Clear the Personal source and select a non-Personal one
    await page.locator("#sourceId").getByRole("button").click();
    const altSourceName = `Alt Source ${Date.now()}`;
    await page.getByPlaceholder("Search for a source...").fill(altSourceName);
    await page.waitForResponse(/\/api\/trpc\/sources\.search/);
    await page.getByRole("button", { name: new RegExp(`Create "${altSourceName}"`) }).click();
    await page.getByRole("button", { name: /Update Recipe/ }).click();
    await page.waitForURL(/\/recipes\/[a-f0-9]+$/);

    // Edit again: clear the alt source, re-select Personal, assert name is empty
    await gotoAndWaitForHydration(page, `/recipes/${recipeId}/edit`);
    await page.locator("#sourceId").getByRole("button").click();
    await selectPersonalSource(page, "");

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
