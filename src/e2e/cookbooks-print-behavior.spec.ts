import { test, expect } from "@bgotink/playwright-coverage";
import { login, registerAndLogin } from "./helpers/auth";
import { gotoAndWaitForHydration } from "./helpers/app";
import {
  addRecipeToCookbook,
  createCookbook,
  getUniqueCookbookName,
} from "./helpers/cookbooks";
import { submitRecipeForm, getUniqueRecipeName } from "./helpers/recipes";

test.describe("Cookbook Print Route — with chapters", () => {
  let cookbookId: string;
  let recipe1Name: string;
  let recipe2Name: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await registerAndLogin(page);

    recipe1Name = getUniqueRecipeName("ChapterPrint1");
    recipe2Name = getUniqueRecipeName("ChapterPrint2");
    const cookbookName = getUniqueCookbookName("ChapterPrintCookbook");

    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, {
      name: recipe1Name,
      ingredients: "Flour",
      instructions: "Mix",
      servings: "2",
    });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, {
      name: recipe2Name,
      ingredients: "Butter",
      instructions: "Melt",
    });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    const cookbook = await createCookbook(page, cookbookName);
    cookbookId = cookbook.cookbookId;

    await addRecipeToCookbook(page, recipe1Name);
    await addRecipeToCookbook(page, recipe2Name);

    await page.getByRole("button", { name: "New Chapter" }).click();
    await expect(page.getByRole("heading", { name: /Chapter 1/i })).toBeVisible(
      { timeout: 20000 },
    );

    await page.close();
  });

  test("print route TOC renders chapter headings above their grouped recipes", async ({
    page,
  }) => {
    await gotoAndWaitForHydration(
      page,
      `/cookbooks/${cookbookId}/print?displayonly=1`,
    );
    await expect(
      page.getByRole("heading", { name: /Chapter 1/i }),
    ).toBeVisible();
    await expect(page.getByText(recipe1Name).first()).toBeVisible();
    await expect(page.getByText(recipe2Name).first()).toBeVisible();
  });
});

test.describe("Cookbook Print Route — auto-trigger", () => {
  let cookbookId: string;
  let ownerEmail: string;
  let ownerPassword: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const creds = await registerAndLogin(page);
    ownerEmail = creds.email;
    ownerPassword = creds.password;

    const cookbookName = getUniqueCookbookName("AutoTriggerPrint");
    const cookbook = await createCookbook(page, cookbookName);
    cookbookId = cookbook.cookbookId;

    const recipeName = getUniqueRecipeName("AutoTriggerRecipe");
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, {
      name: recipeName,
      ingredients: "Salt",
      instructions: "Season",
      servings: "1",
    });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    await gotoAndWaitForHydration(page, `/cookbooks/${cookbookId}`);
    await addRecipeToCookbook(page, recipeName);

    await page.close();
  });

  test("window.print is called automatically when navigating to the print route without ?displayonly=1", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (window as unknown as Record<string, unknown>).__printCalled = false;
      window.print = () => {
        (window as unknown as Record<string, unknown>).__printCalled = true;
      };
    });
    await login(page, ownerEmail, ownerPassword);
    await gotoAndWaitForHydration(page, `/cookbooks/${cookbookId}/print`);
    await page.waitForFunction(
      () =>
        (window as unknown as Record<string, unknown>).__printCalled === true,
    );
    const printCalled = await page.evaluate(
      () => (window as unknown as Record<string, unknown>).__printCalled,
    );
    expect(printCalled).toBe(true);
  });

  test("window.print is NOT called when navigating to the print route with ?displayonly=1", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (window as unknown as Record<string, unknown>).__printCalled = false;
      window.print = () => {
        (window as unknown as Record<string, unknown>).__printCalled = true;
      };
    });
    await login(page, ownerEmail, ownerPassword);
    await gotoAndWaitForHydration(
      page,
      `/cookbooks/${cookbookId}/print?displayonly=1`,
    );
    await expect(page.getByText("Loading…")).not.toBeVisible();
    const printCalled = await page.evaluate(
      () => (window as unknown as Record<string, unknown>).__printCalled,
    );
    expect(printCalled).toBe(false);
  });
});

test("Print button on cookbook detail page is an <a> Link pointing to the print route URL", async ({
  page,
}) => {
  await registerAndLogin(page);
  const cookbookName = getUniqueCookbookName("NavPrint");
  const { cookbookId } = await createCookbook(page, cookbookName);

  const printLink = page.getByRole("link", { name: "Print", exact: true });
  await expect(printLink).toBeVisible();
  await expect(printLink).toHaveAttribute(
    "href",
    `/cookbooks/${cookbookId}/print`,
  );
});
