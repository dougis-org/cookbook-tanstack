import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClientProvider } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/trpc'
import { ThemeProvider } from '@/contexts/ThemeContext'

import Header from '../components/Header'

import appCss from '../styles.css?url'
import printCss from '../styles/print.css?url'

export const Route = createRootRoute({
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
  // Static string — no user data interpolated. Safe per design Decision 4.
  // Accepts any single alphanumeric-token theme id from localStorage so new themes
  // (e.g. 'solarized') work without touching this script. Falls back to 'dark'.
  const themeInitScript =
    'try{var t=localStorage.getItem("cookbook-theme");document.documentElement.className=(t&&/^\\w+$/.test(t))?t:"dark";}catch(e){}'

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line react/no-danger -- static string, no XSS surface */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
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
