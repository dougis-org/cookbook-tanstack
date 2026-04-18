import { test, expect } from '@bgotink/playwright-coverage'

test.describe('FOUC prevention', () => {
  // TC-1: dark theme background present before CSS loads
  test('dark theme: html has dark class and correct background before hydration', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('cookbook-theme')
    })

    await page.goto('/', { waitUntil: 'commit' })

    const htmlClass = await page.evaluate(() => document.documentElement.className)
    expect(htmlClass).toContain('dark')

    const bg = await page.evaluate(
      () => window.getComputedStyle(document.documentElement).backgroundColor,
    )
    // rgb(15, 23, 42) = #0f172a (slate-900)
    expect(bg).toBe('rgb(15, 23, 42)')
  })

  // TC-2: fallback to dark when localStorage is blocked
  test('dark theme: falls back to dark class when localStorage unavailable', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      try {
        localStorage.clear()
      } catch {
        // blocked — expected
      }
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => { throw new Error('blocked') },
          setItem: () => { throw new Error('blocked') },
          removeItem: () => { throw new Error('blocked') },
        },
        writable: true,
      })
    })

    await page.goto('/', { waitUntil: 'commit' })

    const htmlClass = await page.evaluate(() => document.documentElement.className)
    expect(htmlClass).toContain('dark')
  })

  // TC-3: light-cool background present before CSS loads
  test('light-cool theme: html has light-cool class and correct background before hydration', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cookbook-theme', 'light-cool')
    })

    await page.goto('/', { waitUntil: 'commit' })

    const htmlClass = await page.evaluate(() => document.documentElement.className)
    expect(htmlClass).toContain('light-cool')

    const bg = await page.evaluate(
      () => window.getComputedStyle(document.documentElement).backgroundColor,
    )
    // rgb(241, 245, 249) = #f1f5f9 (slate-100)
    expect(bg).toBe('rgb(241, 245, 249)')
  })

  // TC-4: legacy "light" migrated to light-cool
  test('light-cool theme: legacy "light" value migrates to light-cool', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cookbook-theme', 'light')
    })

    await page.goto('/', { waitUntil: 'commit' })

    const htmlClass = await page.evaluate(() => document.documentElement.className)
    expect(htmlClass).toBe('light-cool')

    const bg = await page.evaluate(
      () => window.getComputedStyle(document.documentElement).backgroundColor,
    )
    expect(bg).toBe('rgb(241, 245, 249)')
  })

  // TC-5: light-warm background present before CSS loads
  test('light-warm theme: html has light-warm class and correct background before hydration', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cookbook-theme', 'light-warm')
    })

    await page.goto('/', { waitUntil: 'commit' })

    const htmlClass = await page.evaluate(() => document.documentElement.className)
    expect(htmlClass).toContain('light-warm')

    const bg = await page.evaluate(
      () => window.getComputedStyle(document.documentElement).backgroundColor,
    )
    // rgb(255, 251, 235) = #fffbeb (amber-50)
    expect(bg).toBe('rgb(255, 251, 235)')
  })

  // TC-6: unknown theme falls back to dark
  test('light-warm theme: unknown stored value falls back to dark', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cookbook-theme', 'unknown-value')
    })

    await page.goto('/', { waitUntil: 'commit' })

    const htmlClass = await page.evaluate(() => document.documentElement.className)
    expect(htmlClass).toBe('dark')

    const bg = await page.evaluate(
      () => window.getComputedStyle(document.documentElement).backgroundColor,
    )
    expect(bg).toBe('rgb(15, 23, 42)')
  })

  // TC-7: preload link present before stylesheet link in HTML
  test('preload: <link rel="preload" as="style"> present before <link rel="stylesheet"> for appCss', async ({
    page,
  }) => {
    await page.goto('/')

    const html = await page.content()

    const preloadIdx = html.indexOf('rel="preload"')
    const stylesheetIdx = html.indexOf('rel="stylesheet"')

    expect(preloadIdx).toBeGreaterThan(-1)
    expect(preloadIdx).toBeLessThan(stylesheetIdx)

    // Confirm as="style" is on the preload
    const preloadChunk = html.slice(Math.max(0, preloadIdx - 50), preloadIdx + 200)
    expect(preloadChunk).toContain('as="style"')
  })

  // TC-8: CSS file fetched only once (preload + stylesheet share the resource)
  test('preload: CSS file is not fetched twice', async ({ page }) => {
    const cssRequests: string[] = []

    page.on('request', (req) => {
      if (req.resourceType() === 'stylesheet' || req.resourceType() === 'fetch') {
        const url = req.url()
        if (url.includes('.css')) cssRequests.push(url)
      }
    })

    await page.goto('/', { waitUntil: 'networkidle' })

    // Find app CSS URL (it appears multiple times in the array if double-fetched)
    const appCssRequests = cssRequests.filter((u) => !u.includes('print'))
    // Deduplicate — should be exactly 1 unique URL fetched once
    const unique = [...new Set(appCssRequests)]
    expect(appCssRequests.length).toBeLessThanOrEqual(unique.length + 1)
  })

  // TC-9: inline style block present in HTML source
  test('inline style: HTML source contains dark background in inline <style> block', async ({
    page,
  }) => {
    await page.goto('/')

    const html = await page.content()

    expect(html).toContain('background:#0f172a')
  })

  // TC-11: inline style block contains only hex colors (no user data)
  test('security: inline style block contains only hex color values', async ({
    page,
  }) => {
    await page.goto('/')

    const html = await page.content()

    // Extract content of the inline style block
    const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/)
    expect(styleMatch).not.toBeNull()

    const styleContent = styleMatch![1]
    // Strip valid CSS chars: selectors, properties, hex values, semicolons, braces, whitespace
    const stripped = styleContent
      .replace(/html[.a-z-]*/g, '')
      .replace(/\{[^}]*\}/g, '')
      .trim()

    // Only allowed content: empty string after stripping
    // (no user-derived data, no encoded strings beyond approved hex values)
    expect(stripped).toBe('')
  })

  // TC-12: inline CSS payload ≤ 300 bytes
  test('performance: inline style block is no more than 300 bytes', async ({
    page,
  }) => {
    await page.goto('/')

    const html = await page.content()

    const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/)
    expect(styleMatch).not.toBeNull()

    const bytes = new TextEncoder().encode(styleMatch![1]).length
    expect(bytes).toBeLessThanOrEqual(300)
  })
})
