import { HeadContent, Scripts, createRootRouteWithContext, useRouterState } from '@tanstack/react-router'
import { getSession } from '@/lib/get-session'
import type { RouterContext } from '@/types/router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClientProvider } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/trpc'
import { ThemeProvider, THEMES } from '@/contexts/ThemeContext'
import { AuthProvider } from '@/hooks/useAuth'
import { GOOGLE_ADSENSE_ACCOUNT } from '@/lib/google-adsense'
import { useEffect } from 'react'

import Header from '../components/Header'
import VerificationBanner from '@/components/auth/VerificationBanner'

import appCss from '../styles.css?url'
import printCss from '../styles/print.css?url'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

function minifyInlineCss(css: string) {
  return css
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .trim()
}

function getValidatedGoogleAnalyticsId() {
  const measurementId = import.meta.env.PROD
    ? import.meta.env.VITE_GOOGLE_ANALYTICS_ID?.trim()
    : undefined

  return measurementId && /^G-[A-Z0-9-]+$/.test(measurementId)
    ? measurementId
    : null
}

function hasInitializedGoogleAnalytics(measurementId: string) {
  return (
    window.dataLayer?.some((entry) => {
      if (!entry || typeof entry !== 'object' || !('length' in entry)) {
        return false
      }

      const [command, id, options] = Array.from(entry as ArrayLike<unknown>)
      return (
        command === 'config' &&
        id === measurementId &&
        typeof options === 'object' &&
        options !== null &&
        'send_page_view' in options
      )
    }) ?? false
  )
}

/*
 * ─────────────────────────────────────────────────────────────────
 * CRITICAL CSS — Theme boot gate (inline <style> in <head> emitted by the root document)
 * These values MUST stay in sync with the CSS token files.
 *
 * When adding a new theme OR changing an existing theme's background:
 *   1. Update criticalCss below (hex/rgb values)
 *   2. Update src/styles/themes/<theme>.css  (--theme-bg, --theme-fg, --theme-accent)
 *   3. Update src/contexts/ThemeContext.tsx   (THEMES array)
 *   4. Update docs/theming.md                (maintenance checklist)
 *
 * Current boot theme values (Tailwind reference -> hex):
 *   dark        bg slate.900 #0f172a   fg white     #ffffff   accent cyan.400  #22d3ee
 *   dark-greens bg selenized #103c48   fg #adbcbc             accent #75b938
 *   light-cool  bg slate.100 #f1f5f9   fg slate.900 #0f172a   accent blue.600  #2563eb
 *   light-warm  bg amber.50  #fffbeb   fg stone.900 #1c1917   accent amber.700 #b45309
 * ─────────────────────────────────────────────────────────────────
 */
const criticalCss = minifyInlineCss(`
  html {
    background: #0f172a;
    color: #fff;
  }

  html.light-cool {
    background: #f1f5f9;
    color: #0f172a;
  }

  html.dark-greens {
    background: #103c48;
    color: #adbcbc;
  }

  html.light-warm {
    background: #fffbeb;
    color: #1c1917;
  }

  body {
    margin: 0;
    background: inherit;
    color: inherit;
  }

  #app-shell {
    display: none;
  }

  #boot-loader {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    display: grid;
    place-items: center;
    min-height: 100vh;
    background: #0f172a;
    color: #fff;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  html.dark-greens #boot-loader {
    background: #103c48;
    color: #adbcbc;
  }

  html.light-cool #boot-loader {
    background: #f1f5f9;
    color: #0f172a;
  }

  html.light-warm #boot-loader {
    background: #fffbeb;
    color: #1c1917;
  }

  .boot-loader__inner {
    display: grid;
    gap: 1rem;
    justify-items: center;
    padding: 2rem;
    text-align: center;
  }

  .boot-loader__title {
    font-size: clamp(1.5rem, 4vw, 2.25rem);
    font-weight: 700;
    letter-spacing: 0;
  }

  .boot-loader__spinner {
    width: 2.5rem;
    height: 2.5rem;
    border: .25rem solid rgb(255 255 255 / .25);
    border-top-color: #22d3ee;
    border-radius: 9999px;
    animation: boot-spin .8s linear infinite;
  }

  html.dark-greens .boot-loader__spinner {
    border-color: rgb(173 188 188 / .18);
    border-top-color: #75b938;
  }

  html.light-cool .boot-loader__spinner {
    border-color: rgb(15 23 42 / .18);
    border-top-color: #2563eb;
  }

  html.light-warm .boot-loader__spinner {
    border-color: rgb(28 25 23 / .18);
    border-top-color: #b45309;
  }

  .boot-loader__status,
  .boot-loader__retry {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
  }

  .boot-loader__status {
    max-width: 18rem;
    font-size: .95rem;
  }

  .boot-loader__retry {
    border: 1px solid currentColor;
    border-radius: .5rem;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font: inherit;
    font-weight: 600;
    padding: .625rem 1rem;
  }

  #boot-loader[data-status="slow"] .boot-loader__status,
  #boot-loader[data-status="failed"] .boot-loader__status,
  #boot-loader[data-status="failed"] .boot-loader__retry {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }

  @keyframes boot-spin {
    to {
      transform: rotate(360deg);
    }
  }
`)

const googleAnalyticsId = getValidatedGoogleAnalyticsId()
const googleAnalyticsSrc = googleAnalyticsId
  ? `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleAnalyticsId)}`
  : null
const googleAnalyticsBootstrapScript = googleAnalyticsId
  ? 'window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};'
  : null

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
      {
        name: 'google-adsense-account',
        content: GOOGLE_ADSENSE_ACCOUNT,
      },
    ],
    links: [
      { rel: 'preload', as: 'style', href: appCss },
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'stylesheet',
        href: printCss,
        // print.css also wraps rules in @media print; link media keeps it off the render-blocking path.
        media: 'print',
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  // Allowlist serialized as JSON data — avoids injection risk if a theme ID ever contains quotes.
  // Migrates legacy 'light' → 'light-cool'. Only theme IDs from THEMES are serialized here.
  const validIds = JSON.stringify(THEMES.map((t) => t.id)).replace(/</g, '\\u003c')

  const themeInitScript = `{try{const ids=${validIds};let t=localStorage.getItem("cookbook-theme");if(t==="light"){t="light-cool";try{localStorage.setItem("cookbook-theme","light-cool");}catch(e){}}document.documentElement.className=ids.includes(t)?t:"dark";}catch(e){document.documentElement.className="dark";}}`
  const bootLoaderScript = `{(function(){function init(){var b=document.getElementById("boot-loader");var r=document.getElementById("boot-loader-retry");var s=document.getElementById("app-shell");var l=document.querySelector('link[rel="stylesheet"][href="${appCss}"]');var settled=false;var slowTimer;var failureTimer;function clearTimers(){if(slowTimer){clearTimeout(slowTimer);}if(failureTimer){clearTimeout(failureTimer);}}function isShellHidden(){if(!s){return true;}var styles=window.getComputedStyle(s);return styles.display==="none"||styles.visibility==="hidden"||styles.opacity==="0";}function markLoaded(){if(settled){return;}settled=true;clearTimers();}function markFailed(){if(settled||!b){return;}settled=true;clearTimers();b.setAttribute("data-status","failed");}if(!b||!r){return;}r.addEventListener("click",function(){window.location.reload();});if(!isShellHidden()){return;}slowTimer=window.setTimeout(function(){if(!settled){b.setAttribute("data-status","slow");}},1200);failureTimer=window.setTimeout(function(){if(!settled&&isShellHidden()){markFailed();}},10000);if(l){l.addEventListener("load",markLoaded,{once:true});l.addEventListener("error",markFailed,{once:true});}}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",init,{once:true});}else{init();}})()}`

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {googleAnalyticsSrc ? <script async src={googleAnalyticsSrc} /> : null}
        {googleAnalyticsBootstrapScript ? (
          // eslint-disable-next-line react/no-danger -- static GA bootstrap, no dynamic interpolation
          <script dangerouslySetInnerHTML={{ __html: googleAnalyticsBootstrapScript }} />
        ) : null}
        {/* eslint-disable-next-line react/no-danger -- static string, no XSS surface */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <style data-id="critical-startup">{criticalCss}</style>
        {/* eslint-disable-next-line react/no-danger -- static string, no XSS surface */}
        <script dangerouslySetInnerHTML={{ __html: bootLoaderScript }} />
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
        <div id="boot-loader">
          <div className="boot-loader__inner">
            <div
              className="boot-loader__spinner"
              data-testid="boot-spinner"
              aria-hidden="true"
            />
            <div className="boot-loader__title">Pre-heating</div>
            <div
              id="boot-loader-status"
              className="boot-loader__status"
              role="status"
              aria-live="polite"
            >
              Still pre-heating. This is taking longer than expected.
            </div>
            <button
              id="boot-loader-retry"
              className="boot-loader__retry"
              type="button"
            >
              Retry
            </button>
          </div>
        </div>
        <div id="app-shell">
          <QueryClientProvider client={getQueryClient()}>
            <ThemeProvider>
              {googleAnalyticsId ? <GoogleAnalyticsPageTracker measurementId={googleAnalyticsId} /> : null}
              <AuthProvider>
                <Header />
                <VerificationBanner />
                {children}
              </AuthProvider>
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
        </div>
      </body>
    </html>
  )
}

function GoogleAnalyticsPageTracker({
  measurementId,
}: {
  measurementId: string | null
}) {
  const pagePath = useRouterState({
    select: (state) =>
      `${state.location.pathname}${state.location.searchStr}${state.location.hash}`,
  })

  useEffect(() => {
    if (!measurementId || hasInitializedGoogleAnalytics(measurementId)) {
      return
    }

    window.gtag?.('js', new Date())
    window.gtag?.('config', measurementId, { send_page_view: false })
  }, [measurementId])

  useEffect(() => {
    if (!measurementId || typeof window.gtag !== 'function') {
      return
    }

    window.gtag('config', measurementId, {
      page_path: pagePath,
      page_title: document.title,
      page_location: window.location.href,
    })
  }, [measurementId, pagePath])

  return null
}
