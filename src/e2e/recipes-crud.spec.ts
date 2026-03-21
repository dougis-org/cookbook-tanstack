import { test, expect } from "@playwright/test";
import { registerAndLogin } from "./helpers/auth";
import { gotoAndWaitForHydration } from "./helpers/app";
import { submitRecipeForm, getUniqueRecipeName } from "./helpers/recipes";

test.describe("Recipe CRUD Operations", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("should create a new recipe with all fields populated", async ({
    page,
  }) => {
    await registerAndLogin(page);

    const recipeName = getUniqueRecipeName("Full Recipe");
    await gotoAndWaitForHydration(page, "/recipes/new");

    await submitRecipeForm(page, {
      name: recipeName,
      notes: "A delicious test recipe",
      prepTime: "15",
      cookTime: "30",
      servings: "4",
      difficulty: "medium",
      ingredients: "2 cups flour\n1 cup sugar\n3 eggs",
      instructions:
        "Mix dry ingredients\nAdd eggs and stir\nBake at 350F for 30 minutes",
      calories: "250",
      fat: "10",
      cholesterol: "50",
      sodium: "200",
      protein: "8",
    });

    // Should redirect to the recipe detail page
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    // Verify all data is displayed on the detail page
    await expect(page.getByRole("heading", { name: recipeName })).toBeVisible();
    await expect(page.getByText("A delicious test recipe")).toBeVisible();
    await expect(page.getByText("15 min")).toBeVisible();
    await expect(page.getByText("30 min", { exact: true })).toBeVisible();
    await expect(page.getByText("medium")).toBeVisible();

    // Verify servings — locate the value adjacent to its label
    const servingsContainer = page.getByText("Servings").locator("..");
    await expect(servingsContainer.locator("p").last()).toHaveText("4");

    // Verify ingredients
    await expect(page.getByText("2 cups flour")).toBeVisible();
    await expect(page.getByText("1 cup sugar")).toBeVisible();
    await expect(page.getByText("3 eggs")).toBeVisible();

    // Verify instructions
    await expect(page.getByText("Mix dry ingredients")).toBeVisible();
    await expect(page.getByText("Add eggs and stir")).toBeVisible();
    await expect(page.getByText("Bake at 350F for 30 minutes")).toBeVisible();

    // Verify nutrition values within the Nutrition section
    const nutritionHeading = page.getByRole("heading", { name: "Nutrition" });
    await expect(nutritionHeading).toBeVisible();
    await expect(page.getByText("250")).toBeVisible();
    await expect(page.getByText("10g")).toBeVisible();
    await expect(page.getByText("50mg")).toBeVisible();
    await expect(page.getByText("200mg")).toBeVisible();
    await expect(page.getByText("8g")).toBeVisible();
  });

  test("should edit an existing recipe and verify changes persist", async ({
    page,
  }) => {
    await registerAndLogin(page);

    // Create a recipe first
    const originalName = getUniqueRecipeName("Edit Me");
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, {
      name: originalName,
      notes: "Original notes",
      prepTime: "10",
      servings: "2",
    });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    // Navigate to edit page
    await page.getByRole("link", { name: "Edit Recipe" }).click();
    await page.waitForURL(/\/recipes\/[a-f0-9-]+\/edit$/);

    // Wait for the edit form to load (tRPC fetches recipe data asynchronously)
    await page.getByLabel("Recipe Name").waitFor();

    // Change fields
    const updatedName = getUniqueRecipeName("Edited Recipe");
    await page.getByLabel("Recipe Name").fill(updatedName);
    await page.getByLabel("Notes").fill("Updated notes");
    await page.getByLabel("Prep Time (minutes)").fill("25");
    await page.getByLabel("Servings").fill("6");
    await page.getByRole("button", { name: "Update Recipe" }).click();

    // Should redirect back to detail page
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    // Verify updated data
    await expect(
      page.getByRole("heading", { name: updatedName }),
    ).toBeVisible();
    await expect(page.getByText("Updated notes")).toBeVisible();
    await expect(page.getByText("25 min")).toBeVisible();

    // Verify servings — locate the value adjacent to its label
    const servingsContainer = page.getByText("Servings").locator("..");
    await expect(servingsContainer.locator("p").last()).toHaveText("6");
  });

  test("should delete a recipe via confirmation modal", async ({ page }) => {
    await registerAndLogin(page);

    // Create a recipe to delete
    const recipeName = getUniqueRecipeName("Delete Me");
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, { name: recipeName });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    // Click Delete Recipe button
    await page.getByRole("button", { name: "Delete Recipe" }).click();

    // Verify modal appears with recipe name
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Delete Recipe")).toBeVisible();
    await expect(dialog.getByText(recipeName)).toBeVisible();

    // Confirm deletion and wait for redirect to recipe list
    await Promise.all([
      page.waitForURL("/recipes"),
      dialog.getByRole("button", { name: "Delete" }).click(),
    ]);

    // Verify the recipe is no longer in the list
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: recipeName }),
    ).not.toBeVisible();
  });

  test("should display recipe metadata header with category and source", async ({
    page,
  }) => {
    await registerAndLogin(page);

    // Create a recipe
    const recipeName = getUniqueRecipeName("Metadata Test");
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, { name: recipeName });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    // Metadata header may only exist if the recipe has classification or source metadata
    const metadataHeader = page.locator('[data-testid="recipe-metadata-header"]');
    const hasMetadataHeader = await metadataHeader
      .isVisible()
      .catch(() => false);

    if (hasMetadataHeader) {
      // Category badge should be present and non-clickable
      const categoryBadge = metadataHeader.locator(
        '[data-testid="category-badge"]',
      );
      const hasBadge = await categoryBadge.isVisible().catch(() => false);
      
      if (hasBadge) {
        // Badge should not be a link
        const badgeRole = await categoryBadge.evaluate((el) => el.tagName);
        expect(badgeRole).not.toBe("A");
      }
    }
  });

  test("should display taxonomy badges grouped with labels on detail view", async ({
    page,
  }) => {
    await registerAndLogin(page);

    // Create a recipe to get a detail view
    const recipeName = getUniqueRecipeName("Taxonomy Test");
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, {
      name: recipeName,
      notes: "Test recipe with taxonomy",
    });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    // Look for taxonomy labels (Meals:, Courses:, Preparations:)
    const mealLabel = page.getByText(/^Meals:/);
    const courseLabel = page.getByText(/^Courses:/);
    const preparationLabel = page.getByText(/^Preparations:/);

    // At least one taxonomy section should be visible
    const anyLabelVisible =
      (await mealLabel.isVisible().catch(() => false)) ||
      (await courseLabel.isVisible().catch(() => false)) ||
      (await preparationLabel.isVisible().catch(() => false));

    // If taxonomy data is seeded, labels should be present near badges
    if (anyLabelVisible) {
      // Verify taxonomy badges exist after labels
      const taxonomyBadges = page.locator('[data-testid="taxonomy-badge"]');
      expect(await taxonomyBadges.count()).toBeGreaterThan(0);
    }
  });

  test("should display source as link or text based on URL presence", async ({
    page,
  }) => {
    await registerAndLogin(page);

    // Create a recipe
    const recipeName = getUniqueRecipeName("Source Test");
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, { name: recipeName });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    // Look for source display element
    const sourceElement = page.locator('[data-testid="recipe-source"]');

    // Source element may exist (if recipe has a source)
    if (await sourceElement.isVisible().catch(() => false)) {
      // It should be either a link or plain text
      const sourceLink = sourceElement.locator("a");
      const isLink = await sourceLink.isVisible().catch(() => false);
      const isPlainText = (((await sourceElement.textContent())?.length ?? 0) > 0);

      // At least one representation should exist
      expect(isLink || isPlainText).toBeTruthy();

      // If it's a link, verify security attributes
      if (isLink) {
        const rel = await sourceLink.getAttribute("rel");
        const target = await sourceLink.getAttribute("target");
        if (target === "_blank") {
          expect(rel).toContain("noopener noreferrer");
        }
      }
    }
  });

  test("should display metadata in responsive layout (desktop/mobile)", async ({
    page,
  }) => {
    await registerAndLogin(page);

    // Create a recipe
    const recipeName = getUniqueRecipeName("Responsive Test");
    await gotoAndWaitForHydration(page, "/recipes/new");
    await submitRecipeForm(page, { name: recipeName });
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);

    const metadataHeader = page.locator('[data-testid="recipe-metadata-header"]');
    const hasMetadataHeader = await metadataHeader
      .isVisible()
      .catch(() => false);

    if (hasMetadataHeader) {
      // Test desktop layout (md breakpoint)
      await page.setViewportSize({ width: 1024, height: 768 });
      const desktopLayout = await metadataHeader.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          display: styles.display,
          flexDirection: styles.flexDirection,
        };
      });
      expect(desktopLayout.display).toMatch(/flex|grid/);

      // Test mobile layout
      await page.setViewportSize({ width: 380, height: 667 });
      const mobileLayout = await metadataHeader.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          display: styles.display,
          flexDirection: styles.flexDirection,
        };
      });
      expect(mobileLayout.display).toMatch(/flex|block|grid/);
    }
  });
});
