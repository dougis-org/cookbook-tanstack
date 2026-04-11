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

function getRequiredPluginIndex(pluginNames: string[], pluginName: string): number {
  expect(pluginNames).toContain(pluginName)
  return pluginNames.indexOf(pluginName)
}

describe('vite config', () => {
  it('preserves the required application plugin order', () => {
    const originalEnv = { ...process.env }

    try {
      const pluginNames = getPluginNames(
        viteConfig({ mode: 'test', command: 'build', isSsrBuild: false, isPreview: false }).plugins,
      )

      const assertOrder = (first: string, second: string) => {
        expect(getRequiredPluginIndex(pluginNames, first)).toBeLessThan(
          getRequiredPluginIndex(pluginNames, second),
        )
      }

      assertOrder('@tanstack/devtools:inject-source', 'nitro:init')
      assertOrder('nitro:init', 'vite-tsconfig-paths')
      assertOrder('vite-tsconfig-paths', '@tailwindcss/vite:scan')
      assertOrder('@tailwindcss/vite:scan', 'tanstack-react-start:config')
      assertOrder('tanstack-react-start:config', 'vite:react-refresh')
      expect(pluginNames).toContain('tanstack:router-generator')
      assertOrder('vite:react-refresh', 'vite:react-virtual-preamble')
    } finally {
      for (const key of Object.keys(process.env)) {
        if (!(key in originalEnv)) {
          delete process.env[key]
        }
      }

      Object.assign(process.env, originalEnv)
    }
  })

  it('keeps vitest config aligned with the expected plugin chain', () => {
    const pluginNames = getPluginNames(vitestConfig.plugins)
    const viteTsconfigPathsIndex = getRequiredPluginIndex(pluginNames, 'vite-tsconfig-paths')
    const viteReactRefreshIndex = getRequiredPluginIndex(pluginNames, 'vite:react-refresh')
    const viteReactVirtualPreambleIndex = getRequiredPluginIndex(
      pluginNames,
      'vite:react-virtual-preamble',
    )

    expect(pluginNames[0]).toBe('vite-tsconfig-paths')
    expect(viteTsconfigPathsIndex).toBeLessThan(viteReactRefreshIndex)
    expect(viteReactRefreshIndex).toBeLessThan(viteReactVirtualPreambleIndex)
  })
})
