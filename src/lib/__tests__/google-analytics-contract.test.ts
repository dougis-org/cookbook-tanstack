import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = process.cwd()
const rootRoutePath = resolve(repoRoot, 'src/routes/__root.tsx')
const envExamplePath = resolve(repoRoot, '.env.example')

describe('Google Analytics integration contract', () => {
  it('loads the GA tag only when a validated measurement ID is configured', () => {
    const rootRoute = readFileSync(rootRoutePath, 'utf8')

    expect(rootRoute).toContain('VITE_GOOGLE_ANALYTICS_ID')
    expect(rootRoute).toContain('https://www.googletagmanager.com/gtag/js?id=')
    expect(rootRoute).toMatch(/\^G-\[A-Z0-9-\]\+\$/)
  })

  it('disables the default pageview and sends SPA page metadata explicitly', () => {
    const rootRoute = readFileSync(rootRoutePath, 'utf8')

    expect(rootRoute).toContain('send_page_view:false')
    expect(rootRoute).toContain('page_path: pagePath')
    expect(rootRoute).toContain('page_title: document.title')
    expect(rootRoute).toContain('page_location: window.location.href')
    expect(rootRoute).toContain('GoogleAnalyticsPageTracker')
  })

  it('documents the optional measurement ID in the example environment file', () => {
    const envExample = readFileSync(envExamplePath, 'utf8')

    expect(envExample).toContain('Google Analytics 4 measurement ID')
    expect(envExample).toContain('VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX')
  })
})
