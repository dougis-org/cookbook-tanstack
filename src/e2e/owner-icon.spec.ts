import { test, expect } from "@bgotink/playwright-coverage";
import { registerAndLogin } from "./helpers/auth";
import { gotoAndWaitForHydration } from "./helpers/app";
import { getUniqueRecipeName, submitRecipeForm } from "./helpers/recipes";
import { createCookbook, getUniqueCookbookName } from "./helpers/cookbooks";

const OWN_THIS = "You own this";

test.describe("Owner icon — recipe detail page", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("TC-9.1: owner sees User icon on recipe detail page", async ({
    page,
  }) => {
    await registerAndLogin(page);
    const name = getUniqueRecipeName("Owner Icon Recipe");
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, { name });
    await page.waitForURL(/\/recipes\/[a-f0-9]{24}$/i);

    const icon = page.getByRole("img", { name: OWN_THIS });
    await expect(icon).toBeVisible();
  });

  test("TC-9.2: non-owner sees no User icon on recipe detail page", async ({
    page,
  }) => {
    // Create recipe as owner
    await registerAndLogin(page);
    const name = getUniqueRecipeName("Non-Owner Icon Recipe");
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, { name });
    await page.waitForURL(/\/recipes\/[a-f0-9]{24}$/i);
    const recipeUrl = page.url();

    // Log in as a different user and navigate to the same recipe
    await page.context().clearCookies();
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, recipeUrl);

    await expect(page.getByRole("img", { name: OWN_THIS })).not.toBeVisible();
  });

  test("TC-P.1: User icon not visible in print media on recipe detail", async ({
    page,
  }) => {
    await registerAndLogin(page);
    const name = getUniqueRecipeName("Print Icon Recipe");
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, { name });
    await page.waitForURL(/\/recipes\/[a-f0-9]{24}$/i);

    await page.emulateMedia({ media: "print" });

    const icon = page.getByRole("img", { name: OWN_THIS });
    await expect(icon).not.toBeVisible();
  });
});

test.describe("Owner icon — cookbook detail page", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("TC-10.1: owner sees User icon on cookbook detail page", async ({
    page,
  }) => {
    await registerAndLogin(page);
    const cookbookName = getUniqueCookbookName("Owner Icon Cookbook");
    await createCookbook(page, cookbookName);

    const icon = page.getByRole("img", { name: OWN_THIS });
    await expect(icon).toBeVisible();
  });

  test("TC-10.2: non-owner sees no User icon on cookbook detail page", async ({
    page,
  }) => {
    // Create cookbook as owner
    await registerAndLogin(page);
    const cookbookName = getUniqueCookbookName("Non-Owner Cookbook");
    const { cookbookUrl } = await createCookbook(page, cookbookName);

    // Log in as a different user
    await page.context().clearCookies();
    await registerAndLogin(page);
    await gotoAndWaitForHydration(page, cookbookUrl);

    await expect(page.getByRole("img", { name: OWN_THIS })).not.toBeVisible();
  });

  test("TC-P.2: User icon not visible in print media on cookbook detail", async ({
    page,
  }) => {
    await registerAndLogin(page);
    const cookbookName = getUniqueCookbookName("Print Cookbook");
    await createCookbook(page, cookbookName);

    await page.emulateMedia({ media: "print" });

    const icon = page.getByRole("img", { name: OWN_THIS });
    await expect(icon).not.toBeVisible();
  });
});

test.describe("Owner icon — logged-out user sees no icons", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("TC-E2E.1: logged-out user sees no User icon on recipe listing", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(page, "/recipes");
    await expect(
      page.getByRole("img", { name: OWN_THIS }).first(),
    ).not.toBeVisible();
  });

  test("TC-E2E.2: logged-out user sees no User icon on cookbook listing", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(page, "/cookbooks");
    await expect(
      page.getByRole("img", { name: OWN_THIS }).first(),
    ).not.toBeVisible();
  });
});
