import { type ReactNode, useEffect } from 'react'

// Removes the `dark` class from <html> while mounted so that Tailwind `dark:`
// variants inside this subtree (e.g. RecipeDetail) do not activate from the
// global `.dark` root class. Uses a ref-count in case multiple PrintLayout
// instances are ever nested.
//
// TODO (#281): When the theming system lands, replace the hardcoded
// `bg-white text-gray-900` with CSS variable overrides scoped to this
// element (e.g. `style={{ '--color-background': 'white', '--color-text': '...' }}`).
// That will keep print output fixed regardless of the active theme.
export function PrintLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement
    const countKey = 'printLayoutDarkOverrideCount'
    const hadDarkKey = 'printLayoutDarkOverrideHadDark'
    const currentCount = Number.parseInt(root.dataset[countKey] ?? '0', 10)

    if (currentCount === 0) {
      root.dataset[hadDarkKey] = root.classList.contains('dark') ? 'true' : 'false'
    }

    root.dataset[countKey] = String(currentCount + 1)
    root.classList.remove('dark')

    return () => {
      const nextCount = Math.max(
        0,
        Number.parseInt(root.dataset[countKey] ?? '1', 10) - 1,
      )

      if (nextCount === 0) {
        if (root.dataset[hadDarkKey] === 'true') {
          root.classList.add('dark')
        }
        delete root.dataset[countKey]
        delete root.dataset[hadDarkKey]
        return
      }

      root.dataset[countKey] = String(nextCount)
    }
  }, [])

  return <div className="bg-white text-gray-900">{children}</div>
}
