import { type ReactNode } from 'react'

// TODO (#281): When the theming system lands, replace the hardcoded
// `bg-white text-gray-900` with CSS variable overrides scoped to this
// element (e.g. `style={{ '--color-background': 'white', '--color-text': '...' }}`).
// That will keep print output fixed regardless of the active theme.
export function PrintLayout({ children }: { children: ReactNode }) {
  return <div className="bg-white text-gray-900">{children}</div>
}
