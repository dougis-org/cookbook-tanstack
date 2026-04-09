import { test, expect } from "@bgotink/playwright-coverage";
import { registerAndLogin } from "./helpers/auth";
import { gotoAndWaitForHydration } from "./helpers/app";
import {
  createCookbook,
  createCookbookWithRecipe,
  getUniqueCookbookName,
} from "./helpers/cookbooks";

test.describe("Cookbook Detail Owner Controls", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  // ─── Edit and Delete buttons ───────────────────────────────────────────────

  test("should hide Edit and Delete buttons when logged out", async ({
    page,
  }) => {
    await registerAndLogin(page);
    const cookbookName = getUniqueCookbookName("Edit Delete Logged Out");
    const { cookbookUrl } = await createCookbook(page, cookbookName);

    await page.context().clearCookies();
    await gotoAndWaitForHydration(page, cookbookUrl);

    await expect(
      page.getByRole("heading", { name: cookbookName }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit" })).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Delete" }),
    ).not.toBeVisible();
  });

  test("should hide Edit and Delete buttons for non-owner", async ({
    page,
  }) => {
    await registerAndLogin(page);
    const cookbookName = getUniqueCookbookName("Edit Delete Non-Owner");
    const { cookbookUrl } = await createCookbook(page, cookbookName);

    await page.context().clearCookies();
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, cookbookUrl);

    await expect(
      page.getByRole("heading", { name: cookbookName }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit" })).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Delete" }),
    ).not.toBeVisible();
  });

  test("should show Edit and Delete buttons for owner", async ({ page }) => {
    await registerAndLogin(page);
    const cookbookName = getUniqueCookbookName("Edit Delete Owner");
    await createCookbook(page, cookbookName);
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
  });

  // ─── Add Recipe button ─────────────────────────────────────────────────────

  test("should hide Add Recipe button when logged out", async ({ page }) => {
    await registerAndLogin(page);
    const cookbookName = getUniqueCookbookName("Add Recipe Logged Out");
    const { cookbookUrl } = await createCookbook(page, cookbookName);

    await page.context().clearCookies();
    await gotoAndWaitForHydration(page, cookbookUrl);

    await expect(
      page.getByRole("heading", { name: cookbookName }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add Recipe" }),
    ).not.toBeVisible();
  });

  test("should hide Add Recipe button for non-owner", async ({ page }) => {
    await registerAndLogin(page);
    const cookbookName = getUniqueCookbookName("Add Recipe Non-Owner");
    const { cookbookUrl } = await createCookbook(page, cookbookName);

    await page.context().clearCookies();
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, cookbookUrl);

    await expect(
      page.getByRole("heading", { name: cookbookName }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add Recipe" }),
    ).not.toBeVisible();
  });

  test("should show Add Recipe button for owner", async ({ page }) => {
    await registerAndLogin(page);
    const cookbookName = getUniqueCookbookName("Add Recipe Owner");
    await createCookbook(page, cookbookName);
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("button", { name: "Add Recipe" }),
    ).toBeVisible();
  });

  // ─── Drag handle and Remove button ────────────────────────────────────────

  test("should hide drag handle and Remove button when logged out", async ({
    page,
  }) => {
    await registerAndLogin(page);
    const { cookbookUrl, cookbookName } = await createCookbookWithRecipe(
      page,
      "Drag Hidden Logged Out",
    );

    await page.context().clearCookies();
    await gotoAndWaitForHydration(page, cookbookUrl);

    await expect(
      page.getByRole("heading", { name: cookbookName }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Drag to reorder" }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: /Remove/ }),
    ).not.toBeVisible();
  });

  test("should hide drag handle and Remove button for non-owner", async ({
    page,
  }) => {
    await registerAndLogin(page);
    const { cookbookUrl, cookbookName } = await createCookbookWithRecipe(
      page,
      "Drag Hidden Non-Owner",
    );

    await page.context().clearCookies();
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, cookbookUrl);

    await expect(
      page.getByRole("heading", { name: cookbookName }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Drag to reorder" }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: /Remove/ }),
    ).not.toBeVisible();
  });

  test("should show drag handle and Remove button for owner", async ({
    page,
  }) => {
    await registerAndLogin(page);
    await createCookbookWithRecipe(page, "Drag Visible Owner");

    await expect(
      page.getByRole("button", { name: "Drag to reorder" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Remove/ })).toBeVisible();
  });
});
