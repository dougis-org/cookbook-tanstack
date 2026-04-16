import { defineConfig } from 'vitest/config'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [viteReact()],
  test: {
    globalSetup: ['./src/test-helpers/db-global-setup.ts'],
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts', './src/test-helpers/db-connect.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/*.e2e.*'],
    // Use threads pool with Vitest defaults. Per-worker isolation is managed via db-connect.ts
    // and the shared DB cleanup helper in with-clean-db.ts.
    pool: 'threads',
    // Keep maxThreads as default so performance is not unduly constrained.
    // If test leakage occurs, adjust database cleanup instead of forcing serial execution.

    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json'],
      reportsDirectory: './coverage',
      exclude: [
        '**/node_modules/**',
        '**/e2e/**',
        '**/*.e2e.*',
        '**/test-setup.ts',
        '**/__tests__/**',
        '**/routeTree.gen.ts',
        // Build artifacts — bundled library code at tens-of-thousands of lines,
        // all 0% covered, which otherwise collapse the overall coverage metric.
        '.output/**',
        '.vinxi/**',
        'public/assets/**',
        // Project config files — not application logic.
        '*.config.ts',
        '*.config.mjs',
        '**/tools-configs/**',
        // Route registration and route files — E2E-tested, not unit-tested.
        'src/router.tsx',
        'src/routes/**',
        // Seed scripts and pure type definitions contain no testable logic.
        'src/db/seeds/**',
        'src/types/**',
        // Test fixture / mock data — not application logic.
        'src/test-helpers/mocks.ts',
      ],
    },
  },
})
