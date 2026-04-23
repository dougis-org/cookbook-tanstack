import type { Page } from "@playwright/test";
import { gotoAndWaitForHydration } from "./app";
import { getUniqueRecipeName, submitRecipeForm } from "./recipes";
import { getUniqueSuffix } from "./utils";

const COOKBOOK_ID_PATTERN = "[a-f0-9]{24}";

export function getUniqueCookbookName(prefix = "Test Cookbook") {
  const suffix = getUniqueSuffix();
  return `${prefix}-${suffix}`;
}

export async function createCookbook(
  page: Page,
  cookbookName: string,
  options: { isPublic?: boolean } = {},
) {
  await gotoAndWaitForHydration(page, "/cookbooks");
  await page.getByRole("button", { name: "New Cookbook" }).click();
  await page.getByLabel("Name").fill(cookbookName);
  if (options.isPublic === false) {
    await page.getByLabel("Public (visible to everyone)").uncheck();
  }
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await page.waitForLoadState("networkidle");

  const cookbookLink = page
    .getByRole("link")
    .filter({ has: page.getByText(cookbookName, { exact: true }) })
    .first();
  await cookbookLink.waitFor({ state: "visible" });

  const href = await cookbookLink.getAttribute("href");
  if (!href) {
    throw new Error(
      `Failed to read href for cookbook link with name "${cookbookName}".`,
    );
  }

  const idMatch = href.match(new RegExp(`/cookbooks/(${COOKBOOK_ID_PATTERN})\\b`, "i"));
  if (!idMatch || !idMatch[1]) {
    throw new Error(
      `Failed to parse cookbook id from href "${href}" for cookbook "${cookbookName}".`,
    );
  }

  await cookbookLink.click();
  await page.waitForURL(new RegExp(`/cookbooks/${COOKBOOK_ID_PATTERN}$`, "i"));

  return {
    cookbookId: idMatch[1],
    cookbookUrl: page.url(),
    cookbookName,
  };
}

export async function addRecipeToCookbook(page: Page, recipeName: string) {
  await page.getByRole("button", { name: "Add Recipe" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible" });

  const searchBox = dialog.getByPlaceholder("Search recipes…");
  if ((await searchBox.count()) > 0) {
    await searchBox.fill(recipeName);
  }

  const recipeButton = dialog.getByRole("button", { name: recipeName });
  await recipeButton.waitFor({ state: "visible" });
  await recipeButton.click();
  await dialog.waitFor({ state: "hidden" });
}

export async function createCookbookWithRecipe(page: Page, label: string) {
  const recipeName = getUniqueRecipeName(label);
  await gotoAndWaitForHydration(page, "/recipes/new");
  await submitRecipeForm(page, { name: recipeName });
  await page.waitForURL(/\/recipes\/[a-f0-9]{24}$/i);

  const cookbookName = getUniqueCookbookName(label);
  const { cookbookId, cookbookUrl } = await createCookbook(page, cookbookName);

  await addRecipeToCookbook(page, recipeName);
  await page.waitForLoadState("networkidle");

  return { cookbookId, cookbookUrl, cookbookName, recipeName };
}
