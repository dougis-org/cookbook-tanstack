import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = process.cwd()
const rootRoutePath = resolve(repoRoot, 'src/routes/__root.tsx')
const adsenseLibPath = resolve(repoRoot, 'src/lib/google-adsense.ts')
const pageLayoutPath = resolve(repoRoot, 'src/components/layout/PageLayout.tsx')
const envExamplePath = resolve(repoRoot, '.env.example')
const readmePath = resolve(repoRoot, 'README.md')
const adsTxtPath = resolve(repoRoot, 'public/ads.txt')

describe('Google AdSense integration contract', () => {
  it('adds the required publisher verification meta tag to the root document head', () => {
    const rootRoute = readFileSync(rootRoutePath, 'utf8')

    expect(rootRoute).toContain("name: 'google-adsense-account'")
    expect(rootRoute).toContain('GOOGLE_ADSENSE_ACCOUNT')
  })

  it('loads AdSense slot markup from the shared page layout and keeps eligibility centralized', () => {
    const adsenseLib = readFileSync(adsenseLibPath, 'utf8')
    const pageLayout = readFileSync(pageLayoutPath, 'utf8')

    expect(adsenseLib).toContain('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js')
    expect(pageLayout).toContain('isAdEligible(role, session)')
    expect(pageLayout).toContain('data-ad-client={GOOGLE_ADSENSE_ACCOUNT}')
    expect(pageLayout).toContain('data-ad-slot={')
  })

  it('documents the manual AdSense slot configuration requirements', () => {
    const envExample = readFileSync(envExamplePath, 'utf8')
    const readme = readFileSync(readmePath, 'utf8')

    expect(envExample).toContain('VITE_GOOGLE_ADSENSE_TOP_SLOT_ID')
    expect(envExample).toContain('VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID')
    expect(readme).toContain('public/ads.txt')
    expect(readme).toContain('VITE_GOOGLE_ADSENSE_TOP_SLOT_ID')
    expect(readme).toContain('VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID')
  })

  it('ships the required ads.txt publisher declaration', () => {
    const adsTxt = readFileSync(adsTxtPath, 'utf8').trim()

    expect(adsTxt).toBe('google.com, pub-3814997299935267, DIRECT, f08c47fec0942fa0')
  })
})
