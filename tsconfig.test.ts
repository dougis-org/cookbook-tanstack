// @vitest-environment node

import { readFileSync } from 'node:fs'
import { parseConfigFileTextToJson } from 'typescript'
import { describe, expect, it } from 'vitest'

type TsConfig = {
  compilerOptions?: {
    moduleResolution?: string
    strict?: boolean
    noUnusedLocals?: boolean
    noUnusedParameters?: boolean
    types?: string[]
    baseUrl?: string
    paths?: Record<string, string[]>
  }
}

function readJsonFile<T>(path: string): T {
  const fileText = readFileSync(new URL(path, import.meta.url), 'utf8')
  const parsed = parseConfigFileTextToJson(path, fileText)

  if (parsed.error) {
    throw new Error(`failed to parse ${path}`)
  }

  return parsed.config as T
}

describe('tsconfig', () => {
  it('pins the compiler options that keep TypeScript major upgrades predictable', () => {
    const tsconfig = readJsonFile<TsConfig>('./tsconfig.json')

    expect(tsconfig.compilerOptions?.moduleResolution).toBe('bundler')
    expect(tsconfig.compilerOptions?.strict).toBe(true)
    expect(tsconfig.compilerOptions?.noUnusedLocals).toBe(true)
    expect(tsconfig.compilerOptions?.noUnusedParameters).toBe(true)
    expect(tsconfig.compilerOptions?.types).toEqual(['vite/client'])
    expect(tsconfig.compilerOptions?.baseUrl).toBeUndefined()
    expect(tsconfig.compilerOptions?.paths).toEqual({
      '@/*': ['./src/*'],
    })
  })
})
