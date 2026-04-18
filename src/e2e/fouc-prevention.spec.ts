import { test, expect } from '@bgotink/playwright-coverage'

test.describe('FOUC prevention', () => {
  // TC-1: dark theme — critical CSS applies correct background via waitUntil:'commit' (before hydration)
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

  // TC-3: light-cool — critical CSS applies correct background via waitUntil:'commit'
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

  // TC-5: light-warm — critical CSS applies correct background via waitUntil:'commit'
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

  // TC-7: preload link for appCss appears before its matching stylesheet link
  test('preload: <link rel="preload" as="style"> appears before matching <link rel="stylesheet"> for appCss', async ({
    page,
  }) => {
    await page.goto('/')

    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll('link')).map((link, index) => ({
        index,
        rel: link.getAttribute('rel') ?? '',
        as: link.getAttribute('as') ?? '',
        href: link.getAttribute('href') ?? '',
      })),
    )

    const matchingPair = links
      .filter((link) => link.rel === 'preload' && link.as === 'style' && link.href)
      .map((preload) => ({
        preload,
        stylesheet: links.find(
          (link) =>
            link.rel === 'stylesheet' &&
            link.href === preload.href &&
            link.index > preload.index,
        ),
      }))
      .find((pair) => pair.stylesheet)

    expect(matchingPair).toBeDefined()
    expect(matchingPair?.preload.as).toBe('style')
    expect(matchingPair?.preload.href).toBeTruthy()
    expect(matchingPair?.preload.index).toBeLessThan(matchingPair!.stylesheet!.index)
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

    const appCssRequests = cssRequests.filter((u) => !u.includes('print'))
    const unique = [...new Set(appCssRequests)]

    expect(unique.length).toBeGreaterThan(0)
    expect(appCssRequests.length).toBe(unique.length)
  })

  // TC-9: critical style element is present in the DOM
  test('inline style: critical theme <style> block present in DOM with dark background', async ({
    page,
  }) => {
    await page.goto('/')

    const content = await page.evaluate(() => {
      const el = document.querySelector('style[data-id="critical-theme"]')
      return el ? el.textContent : null
    })

    expect(content).not.toBeNull()
    expect(content).toContain('background:#0f172a')
  })

  // TC-11: critical style block contains only allowed hex color values (no user data)
  test('security: inline style block contains only hex color values', async ({
    page,
  }) => {
    await page.goto('/')

    const content = await page.evaluate(() => {
      const el = document.querySelector('style[data-id="critical-theme"]')
      return el ? el.textContent : null
    })

    expect(content).not.toBeNull()

    const normalized = content!.replace(/\s+/g, ' ').trim()
    const allowedInlineCss =
      /^(?:html(?:\.[a-z-]+)?\s*\{\s*(?:(?:background|color)\s*:\s*#[0-9a-fA-F]{3,6}\s*;?\s*)+\}\s*)+$/

    expect(normalized).toMatch(allowedInlineCss)
  })

  // TC-12: inline CSS payload ≤ 300 bytes
  test('performance: inline style block is no more than 300 bytes', async ({
    page,
  }) => {
    await page.goto('/')

    const content = await page.evaluate(() => {
      const el = document.querySelector('style[data-id="critical-theme"]')
      return el ? el.textContent : null
    })

    expect(content).not.toBeNull()

    const bytes = new TextEncoder().encode(content!).length
    expect(bytes).toBeLessThanOrEqual(300)
  })
})
