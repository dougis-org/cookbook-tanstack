import { test, expect } from '@bgotink/playwright-coverage'

test.describe('Home Page Revamp', () => {
  test('document title reflects brand name', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/^My CookBooks/)
  })

  test('anonymous visitor sees public landing page on /', async ({ page }) => {
    await page.goto('/')

    // Should stay on /
    await expect(page).toHaveURL('/')

    // Should see My CookBooks title in the main section (more specific selector)
    const h1 = page.locator('section h1.brand-wordmark')
    await expect(h1).toBeVisible()
    await expect(h1).toHaveText('My CookBooks')
    
    // Should NOT see Create Recipe CTA
    await expect(page.getByRole('link', { name: 'Create Recipe', exact: true })).not.toBeVisible()
    
    // Should see Primary CTA "Start Free — No Credit Card" pointing to /auth/register
    const primaryCta = page.getByRole('link', { name: 'Start Free — No Credit Card' })
    await expect(primaryCta).toBeVisible()
    await expect(primaryCta).toHaveAttribute('href', '/auth/register')
    
    // Should see Secondary CTA "Browse Public Recipes" pointing to /recipes
    const secondaryCta = page.getByRole('link', { name: 'Browse Public Recipes' })
    await expect(secondaryCta).toBeVisible()
    await expect(secondaryCta).toHaveAttribute('href', '/recipes')
    
    // Should see Pricing Teaser "Plans start at $2.99/mo. View Plans" pointing to /pricing
    const pricingText = page.locator('text=Plans start at $2.99/mo.')
    await expect(pricingText).toBeVisible()
    const pricingLink = page.getByRole('link', { name: 'View Plans' })
    await expect(pricingLink).toBeVisible()
    await expect(pricingLink).toHaveAttribute('href', '/pricing')

    // Should see custom image slot for the screenshot
    const imageSlot = page.locator('image-slot#landing-screenshot')
    await expect(imageSlot).toBeVisible()
    await expect(imageSlot).toHaveAttribute('placeholder', 'Add a screenshot of /recipes')
    
    // Should see the placeholder card content inside the image slot
    await expect(imageSlot.locator('text=Explore the Cooking Experience')).toBeVisible()

    // Should see exactly 4 verb-led feature cards that link to /auth/register
    const featuresContainer = page.locator('section:has-text("Features")')
    const featureLinks = featuresContainer.locator('a')
    await expect(featureLinks).toHaveCount(4)
    
    for (let i = 0; i < 4; i++) {
      await expect(featureLinks.nth(i)).toHaveAttribute('href', '/auth/register')
    }

    const featureTitles = ['Save', 'Organize', 'Import', 'Print']
    for (const title of featureTitles) {
      await expect(featuresContainer.locator(`h3:has-text("${title}")`)).toBeVisible()
    }

    // AdSense surfaces stay suppressed in non-production environments
    await expect(page.getByTestId('ad-slot-top')).toHaveCount(0)
    await expect(page.getByTestId('ad-slot-bottom')).toHaveCount(0)
  })

  test('anonymous visitor navigating to /home is redirected to login', async ({ page }) => {
    // Navigating directly to /home should trigger the beforeLoad guard
    await page.goto('/home')
    
    // Should be redirected to /auth/login
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('hero brand mark renders custom SVG and not ChefHat', async ({ page }) => {
    await page.goto('/')
    
    // The LogoMark should be visible and have aria-label="My CookBooks"
    const heroContainer = page.locator('div:has(> h1.brand-wordmark)')
    const logoMark = heroContainer.locator('svg[aria-label="My CookBooks"]')
    await expect(logoMark).toBeVisible()
    
    // The Lucide ChefHat icon should not be rendered in the hero h1 container
    const chefHat = heroContainer.locator('svg.lucide-chef-hat')
    await expect(chefHat).toHaveCount(0)
  })
})
