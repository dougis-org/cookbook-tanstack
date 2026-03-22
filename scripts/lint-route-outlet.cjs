const fs = require('fs')
const path = require('path')

const routesDir = path.join(__dirname, '..', 'src', 'routes')
const files = fs.readdirSync(routesDir).filter((f) => f.endsWith('.tsx'))

// Collect all route definitions once
const routes = new Map() // Map<routePath, { file, content }>
for (const file of files) {
  const filePath = path.join(routesDir, file)
  const content = fs.readFileSync(filePath, 'utf8')
  const matchRoute = content.match(/createFileRoute\('([^']+)'\)/)
  if (!matchRoute) continue

  const routePath = matchRoute[1]
  routes.set(routePath, { file, content })
}

// Build parent -> children map based on path hierarchy
// Note: route path '/' is not treated as a parent for this lint because
// the real app-level parent is __root.tsx, not src/routes/index.tsx.
const parentChildren = new Map()
for (const routePath of routes.keys()) {
  if (routePath === '/') continue

  const parentPath = path.posix.dirname(routePath)
  if (parentPath === '/') continue
  if (!routes.has(parentPath)) continue

  if (!parentChildren.has(parentPath)) {
    parentChildren.set(parentPath, [])
  }
  parentChildren.get(parentPath).push(routePath)
}

let errors = 0
for (const [parentPath, children] of parentChildren.entries()) {
  const parentRoute = routes.get(parentPath)
  if (!parentRoute) continue

  const hasOutlet = /<Outlet\s*\/?\s*>/.test(parentRoute.content) || parentRoute.content.includes('Outlet')
  if (!hasOutlet) {
    console.error(
      `✖ Parent route ${parentPath} (${parentRoute.file}) has child route(s) ${children.join(', ')} but no <Outlet />`
    )
    errors++
  }
}

if (errors > 0) {
  console.error(`\n${errors} route outlet issue(s) found.`)
  process.exit(1)
}

console.log('✓ route outlet lint passed')
process.exit(0)
