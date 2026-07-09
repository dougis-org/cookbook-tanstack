import { test, expect } from "@bgotink/playwright-coverage";
import type { Page } from "@playwright/test";
import { registerAndLogin } from "./helpers/auth";
import { gotoAndWaitForHydration } from "./helpers/app";
import { getUniqueRecipeName } from "./helpers/recipes";

async function saveAndReopenEditForm(page: Page) {
  await page.getByRole("button", { name: /Create Recipe/ }).click();
  await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

  await page.getByRole("link", { name: "Edit Recipe" }).click();
  await page.waitForURL(/\/recipes\/[a-f0-9-]+\/edit$/);
  await page.getByLabel("Recipe Name").waitFor();
}

test.describe("Recipe form Source picker", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await registerAndLogin(page);
  });

  test("opens the Source dropdown, selects an existing source, and persists it", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/recipes/new");
    const recipeName = getUniqueRecipeName("Source Select");
    await page.getByLabel("Recipe Name").fill(recipeName);

    const responsePromise = page.waitForResponse(/\/api\/trpc\/sources\.listPage/);
    await page.locator("#sourceId").click();
    await responsePromise;
    await page.getByRole("option", { name: "Personal", exact: true }).click();

    await saveAndReopenEditForm(page);
    await expect(page.locator("#sourceId")).toContainText("Personal");
  });

  test("creates a new source via Add New Source and selects it", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/recipes/new");
    const recipeName = getUniqueRecipeName("Source Create");
    await page.getByLabel("Recipe Name").fill(recipeName);

    const newSourceName = getUniqueRecipeName("Brand New Source");
    await page.getByRole("button", { name: "Add New Source" }).click();
    await page.getByLabel("Name", { exact: true }).fill(newSourceName);
    await page.getByRole("button", { name: "Create Source" }).click();
    await expect(page.locator("#sourceId")).toContainText(newSourceName, { timeout: 5000 });

    await saveAndReopenEditForm(page);
    await expect(page.locator("#sourceId")).toContainText(newSourceName);
  });

  test("Category field's select/save flow is unaffected", async ({ page }) => {
    await gotoAndWaitForHydration(page, "/recipes/new");
    const recipeName = getUniqueRecipeName("Category Unaffected");
    await page.getByLabel("Recipe Name").fill(recipeName);

    await page.locator("#classificationId").click();
    const listbox = page.getByRole("listbox");
    await listbox.waitFor({ state: "visible" });
    const firstOption = listbox.getByRole("option").first();
    const categoryName = (await firstOption.textContent())?.trim();
    await firstOption.click();

    await saveAndReopenEditForm(page);
    if (categoryName) {
      await expect(page.locator("#classificationId")).toContainText(categoryName);
    }
    await expect(
      page.locator("#classificationId").locator("..").getByRole("button", { name: /add new/i }),
    ).toHaveCount(0);
  });
});
