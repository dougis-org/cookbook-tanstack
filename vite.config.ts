import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

export default defineConfig(({ mode }) => {
  // Inject env file vars into process.env so server-side modules can access them.
  // Vite loads .env files into import.meta.env but not process.env by default.
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
    resolve: { tsconfigPaths: true },
    plugins: [
      devtools(),
      nitro(),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
    ],
  }
})
