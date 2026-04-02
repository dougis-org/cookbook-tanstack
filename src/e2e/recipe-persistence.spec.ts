import { test, expect } from "@bgotink/playwright-coverage";
import { registerAndLogin } from "./helpers/auth";
import { gotoAndWaitForHydration } from "./helpers/app";
import { getUniqueRecipeName } from "./helpers/recipes";

test.describe("Recipe Form Persistence", () => {
  test.beforeEach(async ({ page }) => {
    if (process.env.DEBUG_PW_CONSOLE) {
      page.on("console", (msg) => {
        console.log(`BROWSER (${msg.type()}): ${msg.text()}`);
      });
    }
    await page.context().clearCookies();
  });

  test("should show draft restoration prompt when a newer local draft exists", async ({ page }) => {
    await registerAndLogin(page);
    const recipeName = getUniqueRecipeName("Draft Recipe");
    
    // 1. Go to new recipe page
    await gotoAndWaitForHydration(page, "/recipes/new");
    
    // 2. Type something
    await page.getByLabel("Recipe Name").fill(recipeName);
    await page.waitForTimeout(1000); // ensure state updates
    
    // 3. Wait for autosave to localStorage (1s debounce)
    await page.waitForTimeout(2000); 
    
    // 4. Reload page
    await page.reload();
    await gotoAndWaitForHydration(page, "/recipes/new");
    
    // 5. Verify prompt appears
    await expect(page.getByText("You have an unsaved draft")).toBeVisible();
    
    // 6. Restore draft
    await page.getByRole("button", { name: "Restore" }).click();
    
    // 7. Verify value restored
    await expect(page.getByLabel("Recipe Name")).toHaveValue(recipeName);
  });

  test("should autosave to server in edit mode and suppress navigation guard", async ({ page }) => {
    await registerAndLogin(page);
    const recipeName = getUniqueRecipeName("Autosave Server");
    
    // 1. Create a recipe
    await gotoAndWaitForHydration(page, "/recipes/new");
    await page.getByLabel("Recipe Name").fill(recipeName);
    await page.waitForTimeout(1000);
    await page.getByRole("button", { name: "Create Recipe" }).click();
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);
    
    // 2. Go to edit page
    await page.getByRole("link", { name: "Edit Recipe" }).click();
    await page.waitForURL(/\/recipes\/[a-f0-9-]+\/edit$/);
    
    // 3. Modify field and wait for server autosave (1s debounce + mutation)
    await page.getByLabel("Recipe Name").fill(recipeName + " Updated");
    await page.waitForTimeout(1000);
    
    // Wait for the indicator 
    await expect(page.getByText("Saved")).toBeVisible({ timeout: 10000 });
    
    // 5. Navigate away - first open menu then click link
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("complementary").getByRole("link", { name: "Recipes" }).click();
    await page.waitForURL("/recipes");
    
    // 6. Verify changes persisted on server
    await page.getByRole("heading", { name: recipeName + " Updated" }).click();
    await expect(page.getByRole("heading", { name: recipeName + " Updated" })).toBeVisible();
  });

  test("should allow reverting changes in edit mode", async ({ page }) => {
    await registerAndLogin(page);
    const recipeName = getUniqueRecipeName("Revert Test");
    
    // 1. Create a recipe
    await gotoAndWaitForHydration(page, "/recipes/new");
    await page.getByLabel("Recipe Name").fill(recipeName);
    await page.waitForTimeout(1000);
    await page.getByRole("button", { name: "Create Recipe" }).click();
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/);
    
    // 2. Go to edit page
    await page.getByRole("link", { name: "Edit Recipe" }).click();
    await page.waitForURL(/\/recipes\/[a-f0-9-]+\/edit$/);
    
    // 3. Modify and wait for autosave
    await page.getByLabel("Recipe Name").fill(recipeName + " Dirty");
    await page.waitForTimeout(1000);
    await expect(page.getByText("Saved")).toBeVisible({ timeout: 10000 });
    
    // 4. Click Revert
    await page.getByRole("button", { name: "Revert" }).click();
    
    // 5. Verify name reverted
    await expect(page.getByLabel("Recipe Name")).toHaveValue(recipeName, { timeout: 10000 });
    
    // 6. Verify localStorage purged (by reloading and checking no prompt)
    await page.reload();
    await expect(page.getByText("You have an unsaved draft")).not.toBeVisible();
  });
});
