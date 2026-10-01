import { test, expect } from "@bgotink/playwright-coverage";
import { registerAndLogin } from "./helpers/auth";
import { registerAndLoginWithTier } from "./helpers/admin";
import { gotoAndWaitForHydration, waitForContextToReflect } from "./helpers/app";
import { getUniqueRecipeName, submitRecipeForm } from "./helpers/recipes";
import { createCookbook, addRecipeToCookbook, getUniqueCookbookName } from "./helpers/cookbooks";
import { withMongoDb } from "./helpers/db";

// ─── Shared setup: two genuinely concurrent browser contexts ─────────────────

async function setupOwnerAndRecipient(browser: import("@playwright/test").Browser) {
  const ownerContext = await browser.newContext();
  const recipientContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();
  const recipientPage = await recipientContext.newPage();

  const ownerCreds = await registerAndLoginWithTier(ownerPage, "executive-chef");
  const recipientCreds = await registerAndLogin(recipientPage);

  return { ownerContext, recipientContext, ownerPage, recipientPage, ownerCreds, recipientCreds };
}

async function inviteFromAccountPage(
  ownerPage: import("@playwright/test").Page,
  recipientEmail: string,
  recipientName: string,
) {
  await gotoAndWaitForHydration(ownerPage, "/account");
  const searchInput = ownerPage.getByLabel(/search by email or name/i);
  await searchInput.fill(recipientEmail);
  const resultOption = ownerPage.getByText(recipientEmail);
  await expect(resultOption).toBeVisible({ timeout: 3000 });
  await resultOption.click();
  // Positive signal that the grant landed, not just that the empty state went away.
  await expect(ownerPage.getByRole("list", { name: "Libraries you share" }).getByText(recipientName)).toBeVisible();
}

test.describe("Library sharing — account page", () => {
  test.describe.configure({ mode: "serial" });

  test("owner shares library, recipient sees it live, adds the shared recipe, owner revokes it", async ({ browser }) => {
    const { ownerContext, recipientContext, ownerPage, recipientPage, recipientCreds } =
      await setupOwnerAndRecipient(browser);

    try {
      const recipeName = getUniqueRecipeName("Shared");
      await gotoAndWaitForHydration(ownerPage, "/recipes/new");
      await submitRecipeForm(ownerPage, { name: recipeName, isPublic: false });
      await ownerPage.waitForURL(/\/recipes\/[a-f0-9]{24}$/i);

      // Recipient's recipe list is open before any share exists.
      await gotoAndWaitForHydration(recipientPage, "/recipes");
      await expect(recipientPage.getByText(recipeName)).not.toBeVisible();

      // Owner invites the recipient from the account page's SharingSection.
      await inviteFromAccountPage(ownerPage, recipientCreds.email, recipientCreds.name);

      // Recipient's already-open list reflects the new grant without a reload.
      await waitForContextToReflect(recipientPage, recipientPage.getByText(recipeName));
      await expect(recipientPage.getByText("Shared with me")).toBeVisible();

      // Recipient adds the shared recipe to their own cookbook.
      const recipientCookbookName = getUniqueCookbookName("Recipient");
      const { cookbookUrl: recipientCookbookUrl } = await createCookbook(recipientPage, recipientCookbookName);
      await addRecipeToCookbook(recipientPage, recipeName);
      await expect(recipientPage.getByText(recipeName)).toBeVisible();

      // Owner revokes the share from the account page.
      await gotoAndWaitForHydration(ownerPage, "/account");
      await ownerPage.getByRole("button", { name: /Revoke/ }).click();
      await expect(ownerPage.getByTestId("shares-i-give-empty")).toBeVisible();

      // Recipient's next load shows the entry as unavailable rather than disappearing silently.
      await gotoAndWaitForHydration(recipientPage, recipientCookbookUrl);
      await expect(recipientPage.getByLabel("Remove unavailable recipe")).toBeVisible();
    } finally {
      await ownerContext.close();
      await recipientContext.close();
    }
  });

  test("owner tier downgrade suspends shares, observable from the recipient's next load", async ({ browser }) => {
    const { ownerContext, recipientContext, ownerPage, recipientPage, ownerCreds, recipientCreds } =
      await setupOwnerAndRecipient(browser);

    try {
      const recipeName = getUniqueRecipeName("Downgrade");
      await gotoAndWaitForHydration(ownerPage, "/recipes/new");
      await submitRecipeForm(ownerPage, { name: recipeName, isPublic: false });
      await ownerPage.waitForURL(/\/recipes\/[a-f0-9]{24}$/i);

      await inviteFromAccountPage(ownerPage, recipientCreds.email, recipientCreds.name);

      await gotoAndWaitForHydration(recipientPage, "/recipes");
      await expect(recipientPage.getByText(recipeName)).toBeVisible();

      // Mutate the owner's tier directly in the DB, per the parent change's test convention.
      await withMongoDb(async (db) => {
        await db.collection("user").updateOne({ email: ownerCreds.email }, { $set: { tier: "home-cook" } });
      });

      await gotoAndWaitForHydration(recipientPage, "/recipes");
      await expect(recipientPage.getByText(recipeName)).not.toBeVisible();

      // The account page itself reflects the downgrade: the owner (now
      // non-Executive-Chef, with nothing shared with them) sees the upgrade
      // affordance instead of the invite control, and the recipient (whose
      // one received share was just suspended) sees the same.
      await gotoAndWaitForHydration(ownerPage, "/account");
      await expect(ownerPage.getByLabel(/search by email or name/i)).not.toBeVisible();
      await expect(ownerPage.getByText(/upgrade to invite people to your collection/i)).toBeVisible();

      await gotoAndWaitForHydration(recipientPage, "/account");
      await expect(recipientPage.getByText(/upgrade to invite people to your collection/i)).toBeVisible();
    } finally {
      await ownerContext.close();
      await recipientContext.close();
    }
  });
});
