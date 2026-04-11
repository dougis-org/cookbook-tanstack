// @vitest-environment node

import { describe, expect, it } from 'vitest'
import type { PluginOption } from 'vite'
import viteConfig from './vite.config'
import vitestConfig from './vitest.config'

type NamedPlugin = { name?: string }

function getPluginNames(plugins: PluginOption[] | undefined): string[] {
  if (!plugins) {
    return []
  }

  return plugins.flatMap((plugin): string[] => {
    if (Array.isArray(plugin)) {
      return getPluginNames(plugin)
    }

    if (!plugin || typeof plugin !== 'object' || !('name' in plugin)) {
      return []
    }

    const namedPlugin = plugin as NamedPlugin
    return namedPlugin.name ? [namedPlugin.name] : []
  })
}

describe('vite config', () => {
  it('preserves the required application plugin order', () => {
    const pluginNames = getPluginNames(
      viteConfig({ mode: 'test', command: 'build', isSsrBuild: false, isPreview: false }).plugins,
    )

    expect(pluginNames.indexOf('@tanstack/devtools:inject-source')).toBeLessThan(
      pluginNames.indexOf('nitro:init'),
    )
    expect(pluginNames.indexOf('nitro:init')).toBeLessThan(pluginNames.indexOf('vite-tsconfig-paths'))
    expect(pluginNames.indexOf('vite-tsconfig-paths')).toBeLessThan(
      pluginNames.indexOf('@tailwindcss/vite:scan'),
    )
    expect(pluginNames.indexOf('@tailwindcss/vite:scan')).toBeLessThan(
      pluginNames.indexOf('tanstack-react-start:config'),
    )
    expect(pluginNames.indexOf('tanstack-react-start:config')).toBeLessThan(
      pluginNames.indexOf('vite:react-refresh'),
    )
    expect(pluginNames).toContain('tanstack:router-generator')
    expect(pluginNames).toContain('vite:react-refresh')
    expect(pluginNames).toContain('vite:react-virtual-preamble')
    expect(pluginNames.indexOf('vite:react-refresh')).toBeLessThan(
      pluginNames.indexOf('vite:react-virtual-preamble'),
    )
  })

  it('keeps vitest config aligned with the expected plugin chain', () => {
    const pluginNames = getPluginNames(vitestConfig.plugins)

    expect(pluginNames[0]).toBe('vite-tsconfig-paths')
    expect(pluginNames).toContain('vite:react-refresh')
    expect(pluginNames).toContain('vite:react-virtual-preamble')
    expect(pluginNames.indexOf('vite-tsconfig-paths')).toBeLessThan(
      pluginNames.indexOf('vite:react-refresh'),
    )
  })
})
