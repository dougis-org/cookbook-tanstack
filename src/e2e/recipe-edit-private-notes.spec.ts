import { test, expect } from "@bgotink/playwright-coverage";
import { registerAndLogin } from "./helpers/auth";
import { registerAndLoginWithTier } from "./helpers/admin";
import { gotoAndWaitForHydration, waitForHydration } from "./helpers/app";
import { getUniqueRecipeName, submitRecipeForm } from "./helpers/recipes";

async function createRecipeAndOpenEdit(
  page: import("@playwright/test").Page,
  notes?: string,
) {
  await gotoAndWaitForHydration(page, "/recipes/new");
  await submitRecipeForm(page, { name: getUniqueRecipeName("Edit Notes"), notes });
  await page.waitForURL(/\/recipes\/[a-f0-9]{24}$/i);
  const detailUrl = page.url();
  await gotoAndWaitForHydration(page, `${detailUrl}/edit`);
  return detailUrl;
}

test.describe("Private notes on the recipe edit screen", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("E1: Sous Chef adds a private note from the edit screen", async ({ page }) => {
    await registerAndLoginWithTier(page, "sous-chef");
    const detailUrl = await createRecipeAndOpenEdit(page);

    await page.getByRole("button", { name: /add a note/i }).click();
    await page.getByLabel("Private note content").fill("Edit-screen private note");
    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(
      page.getByTestId("private-notes-panel").getByText("Edit-screen private note"),
    ).toBeVisible();

    // Still on the edit screen: saving the note must not submit the recipe form.
    await expect(page).toHaveURL(/\/edit$/);

    await gotoAndWaitForHydration(page, detailUrl);
    await expect(
      page.getByTestId("private-notes-panel").getByText("Edit-screen private note"),
    ).toBeVisible();
  });

  test("E2: Move to Private Notes relocates public notes", async ({ page }) => {
    await registerAndLoginWithTier(page, "sous-chef");
    const detailUrl = await createRecipeAndOpenEdit(page, "Move me to private");

    await page.getByRole("button", { name: /move to private notes/i }).click();
    await expect(page.getByLabel(/^notes$/i)).toHaveValue("");
    await expect(page.getByTestId("private-notes-panel").getByText("Move me to private")).toBeVisible();

    await page.getByRole("button", { name: /update recipe/i }).click();
    await page.waitForURL(detailUrl);
    await waitForHydration(page);

    await expect(page.getByTestId("private-notes-panel").getByText("Move me to private")).toBeVisible();
    // The public notes were cleared server-side: the recipe card no longer shows them as public notes.
    await expect(page.getByTestId("recipe-detail-card").getByRole("heading", { name: "Notes", exact: true })).toHaveCount(0);
  });

  test("E3: below-tier user sees the upgrade nudge on the edit screen", async ({ page }) => {
    await registerAndLogin(page);
    await createRecipeAndOpenEdit(page);

    await expect(page.getByText(/private notes are part of sous chef/i)).toBeVisible();
    await expect(page.getByLabel("Private note content")).toHaveCount(0);
  });

  test("E4: create screen shows the save-first hint", async ({ page }) => {
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, "/recipes/new");

    await expect(page.getByText("Save this recipe first to add private notes.")).toBeVisible();
  });
});
