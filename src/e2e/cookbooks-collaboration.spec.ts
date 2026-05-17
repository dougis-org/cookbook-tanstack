import { test, expect } from "@bgotink/playwright-coverage";
import type { Page } from "@playwright/test";
import { registerAndLogin, login } from "./helpers/auth";
import { registerAndLoginWithTier } from "./helpers/admin";
import { gotoAndWaitForHydration } from "./helpers/app";
import { createCookbook, getUniqueCookbookName } from "./helpers/cookbooks";

// ─── Shared setup helpers ─────────────────────────────────────────────────────

async function setupOwnerAndCollaborator(page: Page) {
  const ownerCreds = await registerAndLoginWithTier(page, "executive-chef");

  const cookbookName = getUniqueCookbookName("Collab");
  const { cookbookUrl } = await createCookbook(page, cookbookName, {
    isPublic: false,
  });

  // Register the collaborator user with a distinct name, then switch back to owner
  await page.context().clearCookies();
  const collabCreds = await registerAndLogin(page, { name: "Collab User" });

  await page.context().clearCookies();
  await login(page, ownerCreds.email, ownerCreds.password);

  return { ownerCreds, collabCreds, cookbookUrl, cookbookName };
}

async function inviteCollaborator(
  page: Page,
  cookbookUrl: string,
  collabEmail: string,
  role: "editor" | "viewer",
) {
  await gotoAndWaitForHydration(page, cookbookUrl);
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: "Invite" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible" });

  await dialog.getByLabel("Search users").fill(collabEmail);

  // Wait for debounce + search result
  await expect(dialog.getByText(collabEmail)).toBeVisible({ timeout: 3000 });
  await dialog.getByText(collabEmail).click();

  await dialog.getByRole("radio", { name: role }).click();
  await dialog.getByRole("button", { name: "Invite" }).click();

  // Modal closes after successful invite
  await dialog.waitFor({ state: "hidden" });
  await page.waitForLoadState("networkidle");
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe("Cookbook collaboration", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("TC-COL-1: executive-chef owner can invite a collaborator to a cookbook", async ({
    page,
  }) => {
    const { collabCreds, cookbookUrl, cookbookName } =
      await setupOwnerAndCollaborator(page);

    await inviteCollaborator(page, cookbookUrl, collabCreds.email, "editor");

    // Collaborators panel should now show the new collaborator
    const panel = page.getByRole("button", { name: /Collaborators/ });
    await panel.click();
    await expect(page.getByText(collabCreds.name)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: cookbookName }),
    ).toBeVisible();
  });

  test("TC-COL-2: editor collaborator can access shared cookbook and sees Add Recipe button", async ({
    page,
  }) => {
    const { collabCreds, ownerCreds, cookbookUrl } =
      await setupOwnerAndCollaborator(page);

    await inviteCollaborator(page, cookbookUrl, collabCreds.email, "editor");

    // Switch to the collaborator
    await page.context().clearCookies();
    await login(page, collabCreds.email, collabCreds.password);
    await gotoAndWaitForHydration(page, cookbookUrl);
    await page.waitForLoadState("networkidle");

    // Editor can see the cookbook and the Add Recipe button
    await expect(
      page.getByRole("button", { name: "Add Recipe" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Edit" }),
    ).not.toBeVisible();
    // Collaborators panel is visible to all access levels
    await expect(
      page.getByRole("button", { name: /Collaborators/ }),
    ).toBeVisible();

    // Owner credentials are consumed above — suppress unused warning
    void ownerCreds;
  });

  test("TC-COL-3: owner can remove a collaborator from a cookbook", async ({
    page,
  }) => {
    const { collabCreds, ownerCreds, cookbookUrl } =
      await setupOwnerAndCollaborator(page);

    await inviteCollaborator(page, cookbookUrl, collabCreds.email, "editor");

    // Open collaborators panel and remove
    const panelToggle = page.getByRole("button", { name: /Collaborators/ });
    await panelToggle.click();

    const removeBtn = page.getByRole("button", {
      name: `Remove ${collabCreds.name}`,
    });
    await expect(removeBtn).toBeVisible();
    await removeBtn.click();

    // Confirm in the remove dialog
    const confirmDialog = page.getByRole("dialog");
    await confirmDialog.waitFor({ state: "visible" });
    await confirmDialog.getByRole("button", { name: "Remove" }).click();
    await confirmDialog.waitFor({ state: "hidden" });
    await page.waitForLoadState("networkidle");

    // Collaborator name should no longer appear anywhere on the page
    await panelToggle.click();
    await expect(page.getByText(collabCreds.name)).not.toBeVisible();

    // Owner credentials are consumed above — suppress unused warning
    void ownerCreds;
  });
});
