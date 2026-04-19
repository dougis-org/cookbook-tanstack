import { test, expect } from '@bgotink/playwright-coverage'
import type { Page, Route } from '@playwright/test'

interface DelayedAppCss {
  continueRequest: () => void
  abortRequest: () => void
  requested: Promise<string>
}

interface BootThemeExpectation {
  storedTheme: string | null
  expectedClass: string
  expectedStoredTheme?: string
  background: string
  foreground: string
  accent: string
}

function createGate<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((next) => {
    resolve = next
  })
  return { promise, resolve }
}

async function setStoredTheme(page: Page, theme: string | null) {
  await page.addInitScript((t) => {
    if (t === null) {
      localStorage.removeItem('cookbook-theme')
    } else {
      localStorage.setItem('cookbook-theme', t)
    }
  }, theme)
}

async function blockLocalStorage(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.clear()
    } catch {
      // blocked storage is the state under test
    }
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: () => {
          throw new Error('blocked')
        },
        setItem: () => {
          throw new Error('blocked')
        },
        removeItem: () => {
          throw new Error('blocked')
        },
      },
      writable: true,
    })
  })
}

async function delayAppStylesheet(page: Page): Promise<DelayedAppCss> {
  const stylesheetGate = createGate<'continue' | 'abort'>()
  const requestGate = createGate<string>()
  let sawAppCss = false

  await page.route(/\.css($|\?|#)/, async (route: Route) => {
    const url = route.request().url()
    const pathname = new URL(url).pathname
    if (/(^|\/)print(?:-[^/]+)?\.css$/i.test(pathname)) {
      await route.continue()
      return
    }

    if (!sawAppCss) {
      sawAppCss = true
      requestGate.resolve(url)
    }

    const action = await stylesheetGate.promise
    if (action === 'abort') {
      await route.abort('failed')
      return
    }

    await route.continue()
  })

  return {
    continueRequest: () => stylesheetGate.resolve('continue'),
    abortRequest: () => stylesheetGate.resolve('abort'),
    requested: requestGate.promise,
  }
}

async function gotoWithDelayedAppCss(
  page: Page,
  theme: string | null,
): Promise<DelayedAppCss> {
  await setStoredTheme(page, theme)
  const delayedCss = await delayAppStylesheet(page)
  await page.goto('/', { waitUntil: 'commit' })
  await delayedCss.requested
  return delayedCss
}

async function readBootTheme(page: Page) {
  return page.locator('#boot-loader').evaluate((loader) => {
    const spinner = document.querySelector('[data-testid="boot-spinner"]')
    const loaderStyles = window.getComputedStyle(loader)
    const spinnerStyles = spinner ? window.getComputedStyle(spinner) : null
    return {
      background: loaderStyles.backgroundColor,
      foreground: loaderStyles.color,
      accent: spinnerStyles?.borderTopColor ?? '',
    }
  })
}

async function expectBootLoaderVisible(page: Page) {
  await expect(page.locator('#boot-loader')).toBeVisible()
  await expect(page.locator('#boot-loader')).toContainText('Pre-heating')
  await expect(page.locator('[data-testid="boot-spinner"]')).toBeVisible()
}

async function expectAppShellHidden(page: Page) {
  const appShell = page.locator('#app-shell')
  const appShellChildren = page.locator('#app-shell > *')
  await expect(appShell).toHaveCount(1)
  await expect(appShellChildren).not.toHaveCount(0)
  await expect(appShell).not.toBeVisible()
}

test.describe('FOUC prevention', () => {
  test('delayed app stylesheet shows the boot loader and hides app shell content', async ({
    page,
  }) => {
    await gotoWithDelayedAppCss(page, null)

    await expectBootLoaderVisible(page)
    await expectAppShellHidden(page)
  })

  test('app stylesheet completion hides the boot loader and reveals the app shell', async ({
    page,
  }) => {
    const delayedCss = await gotoWithDelayedAppCss(page, null)

    delayedCss.continueRequest()

    await expect(page.locator('#app-shell')).toBeVisible()
    await expect(page.locator('#boot-loader')).not.toBeVisible()
  })

  const themeExpectations: BootThemeExpectation[] = [
    {
      storedTheme: null,
      expectedClass: 'dark',
      background: 'rgb(15, 23, 42)',
      foreground: 'rgb(255, 255, 255)',
      accent: 'rgb(34, 211, 238)',
    },
    {
      storedTheme: 'dark',
      expectedClass: 'dark',
      expectedStoredTheme: 'dark',
      background: 'rgb(15, 23, 42)',
      foreground: 'rgb(255, 255, 255)',
      accent: 'rgb(34, 211, 238)',
    },
    {
      storedTheme: 'light-cool',
      expectedClass: 'light-cool',
      expectedStoredTheme: 'light-cool',
      background: 'rgb(241, 245, 249)',
      foreground: 'rgb(15, 23, 42)',
      accent: 'rgb(37, 99, 235)',
    },
    {
      storedTheme: 'light-warm',
      expectedClass: 'light-warm',
      expectedStoredTheme: 'light-warm',
      background: 'rgb(255, 251, 235)',
      foreground: 'rgb(28, 25, 23)',
      accent: 'rgb(180, 83, 9)',
    },
    {
      storedTheme: 'light',
      expectedClass: 'light-cool',
      expectedStoredTheme: 'light-cool',
      background: 'rgb(241, 245, 249)',
      foreground: 'rgb(15, 23, 42)',
      accent: 'rgb(37, 99, 235)',
    },
    {
      storedTheme: 'unknown-value',
      expectedClass: 'dark',
      expectedStoredTheme: 'unknown-value',
      background: 'rgb(15, 23, 42)',
      foreground: 'rgb(255, 255, 255)',
      accent: 'rgb(34, 211, 238)',
    },
  ]

  for (const theme of themeExpectations) {
    test(`boot loader uses ${theme.expectedClass} styling for stored theme ${theme.storedTheme ?? 'none'}`, async ({
      page,
    }) => {
      await gotoWithDelayedAppCss(page, theme.storedTheme)

      await expectBootLoaderVisible(page)
      await expect(page.locator('html')).toHaveClass(theme.expectedClass)

      if (theme.expectedStoredTheme) {
        const storedTheme = await page.evaluate(() =>
          localStorage.getItem('cookbook-theme'),
        )
        expect(storedTheme).toBe(theme.expectedStoredTheme)
      }

      const bootTheme = await readBootTheme(page)
      expect(bootTheme.background).toBe(theme.background)
      expect(bootTheme.foreground).toBe(theme.foreground)
      expect(bootTheme.accent).toBe(theme.accent)
    })
  }

  test('boot loader falls back to dark when localStorage is unavailable', async ({
    page,
  }) => {
    await blockLocalStorage(page)
    const delayedCss = await delayAppStylesheet(page)
    await page.goto('/', { waitUntil: 'commit' })
    await delayedCss.requested

    await expectBootLoaderVisible(page)
    await expect(page.locator('html')).toHaveClass('dark')

    const bootTheme = await readBootTheme(page)
    expect(bootTheme.background).toBe('rgb(15, 23, 42)')
    expect(bootTheme.foreground).toBe('rgb(255, 255, 255)')
    expect(bootTheme.accent).toBe('rgb(34, 211, 238)')
  })

  test('failed app stylesheet keeps loader visible and shows retry feedback', async ({
    page,
  }) => {
    const delayedCss = await gotoWithDelayedAppCss(page, null)
    delayedCss.abortRequest()

    await expectBootLoaderVisible(page)
    await expectAppShellHidden(page)
    await expect(page.locator('#boot-loader-status')).toBeVisible({
      timeout: 2_500,
    })
    await expect(page.locator('#boot-loader-status')).toContainText(
      'Still pre-heating',
    )
    await expect(page.locator('#boot-loader-retry')).toBeVisible({
      timeout: 5_000,
    })
  })

  test('boot loader retry affordance requests a reload without React hydration', async ({
    page,
  }) => {
    const delayedCss = await gotoWithDelayedAppCss(page, null)
    delayedCss.abortRequest()

    await expect(page.locator('#boot-loader-retry')).toBeVisible({
      timeout: 5_000,
    })

    const reloadPromise = page.waitForEvent('framenavigated')
    await page.locator('#boot-loader-retry').click()
    await reloadPromise
  })

  test('head keeps app preload before app stylesheet and omits print preload', async ({
    page,
  }) => {
    await page.goto('/')

    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll('link')).map((link, index) => ({
        index,
        rel: link.getAttribute('rel') ?? '',
        as: link.getAttribute('as') ?? '',
        href: link.getAttribute('href') ?? '',
        media: link.getAttribute('media') ?? '',
      })),
    )

    const appStylesheet = links.find(
      (link) =>
        link.rel === 'stylesheet' &&
        link.href &&
        !link.href.toLowerCase().includes('print'),
    )
    const printStylesheet = links.find(
      (link) =>
        link.rel === 'stylesheet' &&
        link.href.toLowerCase().includes('print'),
    )

    expect(appStylesheet).toBeDefined()
    expect(printStylesheet).toBeDefined()

    const appPreload = links.find(
      (link) =>
        link.rel === 'preload' &&
        link.as === 'style' &&
        link.href === appStylesheet?.href,
    )
    const printPreload = links.find(
      (link) =>
        link.rel === 'preload' &&
        link.href.toLowerCase().includes('print'),
    )

    expect(appPreload).toBeDefined()
    expect(appPreload!.index).toBeLessThan(appStylesheet!.index)
    expect(printPreload).toBeUndefined()
  })

  test('critical boot style includes loader gate rules and no template markers', async ({
    page,
  }) => {
    await page.goto('/')

    const content = await page.evaluate(() => {
      const el = document.querySelector('style[data-id="critical-theme"]')
      return el ? el.textContent : null
    })

    expect(content).not.toBeNull()
    expect(content).toContain('#boot-loader')
    expect(content).toContain('#app-shell')
    expect(content).toContain('@keyframes boot-spin')
    expect(content).not.toContain('${')

    const bytes = new TextEncoder().encode(content!).length
    expect(bytes).toBeLessThanOrEqual(3_500)
  })
})
