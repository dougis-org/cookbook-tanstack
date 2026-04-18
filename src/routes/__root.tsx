import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import { getSession } from '@/lib/get-session'
import type { RouterContext } from '@/types/router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClientProvider } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/trpc'
import { ThemeProvider, THEMES } from '@/contexts/ThemeContext'

import Header from '../components/Header'

import appCss from '../styles.css?url'
import printCss from '../styles/print.css?url'

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
    const session = await getSession()
    return { session }
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'CookBook - Recipe Management',
      },
    ],
    links: [
      { rel: 'preload', as: 'style', href: appCss },
      { rel: 'preload', as: 'style', href: printCss },
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'stylesheet',
        href: printCss,
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  // Allowlist serialized as JSON data — avoids injection risk if a theme ID ever contains quotes.
  // Migrates legacy 'light' → 'light-cool'. No user data interpolated — safe per design Decision 4.
  const validIds = JSON.stringify(THEMES.map((t) => t.id)).replace(/</g, '\\u003c')

  /*
   * ─────────────────────────────────────────────────────────────────
   * CRITICAL CSS — Theme flash prevention (injected via inline script)
   * These values MUST stay in sync with the CSS token files.
   *
   * When adding a new theme OR changing an existing theme's background:
   *   1. Update criticalCss below (hex values)
   *   2. Update src/styles/themes/<theme>.css  (--theme-bg, --theme-fg)
   *   3. Update src/contexts/ThemeContext.tsx   (THEMES array)
   *   4. Update docs/theming.md                (maintenance checklist)
   *
   * Current theme backgrounds (Tailwind reference → hex):
   *   dark       slate.900  #0f172a   fg: white      #ffffff
   *   light-cool slate.100  #f1f5f9   fg: slate.900  #0f172a
   *   light-warm amber.50   #fffbeb   fg: stone.900  #1c1917
   *   <slot for 4th theme — add here when that change ships>
   * ─────────────────────────────────────────────────────────────────
   */
  const criticalCss = `html{background:#0f172a;color:#fff}html.light-cool{background:#f1f5f9;color:#0f172a}html.light-warm{background:#fffbeb;color:#1c1917}`
  const themeInitScript = `{try{const ids=${validIds};let t=localStorage.getItem("cookbook-theme");if(t==="light"){t="light-cool";try{localStorage.setItem("cookbook-theme","light-cool");}catch(e){}}document.documentElement.className=ids.includes(t)?t:"dark";}catch(e){document.documentElement.className="dark";}}`

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line react/no-danger -- static string, no XSS surface */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <style data-id="critical-theme">{criticalCss}</style>
        {import.meta.env.DEV ? (
          <script
            type="module"
            dangerouslySetInnerHTML={{
              __html:
                'import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => (type) => type; window.__vite_plugin_react_preamble_installed__ = true;',
            }}
          />
        ) : null}
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={getQueryClient()}>
        <ThemeProvider>
        <Header />
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
        </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}
