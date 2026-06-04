import { test, expect } from "@bgotink/playwright-coverage"
import { registerAndLogin } from "./helpers/auth"
import { gotoAndWaitForHydration } from "./helpers/app"
import { submitRecipeForm, getUniqueRecipeName } from "./helpers/recipes"

test.describe("Recipe Share Flow", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies()
    // Grant clipboard read/write permissions to testing context
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
  })

  test("should copy link, show success state, and reset after timeout", async ({ page }) => {
    await registerAndLogin(page)

    const recipeName = getUniqueRecipeName("Share Test Recipe")
    await gotoAndWaitForHydration(page, "/recipes/new")
    await submitRecipeForm(page, { name: recipeName })
    await page.waitForURL(/\/recipes\/[a-f0-9-]+$/)
    await page.waitForLoadState("networkidle")

    const expectedUrl = page.url()

    // Find the Share button
    const shareButton = page.getByRole("button", { name: /^Share$/ })
    await expect(shareButton).toBeVisible()

    // Click the Share button
    await shareButton.click()

    // Check for success label and checkmark icon state
    const copiedButton = page.getByRole("button", { name: /^Copied!$/ })
    await expect(copiedButton).toBeVisible()

    // Verify clipboard content matches current URL
    const clipboardText = await page.evaluate(async () => {
      return await navigator.clipboard.readText()
    })
    expect(clipboardText).toBe(expectedUrl)

    // Wait for the button to reset back to "Share" (should reset in 2000ms, let's wait up to 3000ms)
    await expect(shareButton).toBeVisible({ timeout: 3000 })
  })
})
