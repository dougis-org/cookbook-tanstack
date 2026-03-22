const fs = require('fs')
const path = require('path')

const routesDir = path.join(__dirname, '..', 'src', 'routes')

function collectRouteFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectRouteFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
      files.push(fullPath)
    }
  }

  return files
}

function normalizeRoutePath(routePath) {
  if (routePath === '/') return '/'
  // Keep leading slash, drop trailing slash
  return routePath.replace(/\/+$/g, '')
}

const routeRegex = /createFileRoute\(\s*(['"])([^'"]+)\1\s*\)/g
const files = collectRouteFiles(routesDir)

// Collect all route definitions once
const routes = new Map() // Map<routePath, { file, content }>
for (const filePath of files) {
  const content = fs.readFileSync(filePath, 'utf8')

  for (const matchRoute of content.matchAll(routeRegex)) {
    const rawRoutePath = matchRoute[2]
    const routePath = normalizeRoutePath(rawRoutePath)
    const file = path.relative(routesDir, filePath)
    routes.set(routePath, { file, content })
  }
}

// Build parent -> children map based on path hierarchy
const parentChildren = new Map()
for (const routePath of routes.keys()) {
  if (routePath === '/') continue

  const parentPath = normalizeRoutePath(path.posix.dirname(routePath))
  if (!parentPath || parentPath === '/') continue

  if (!routes.has(parentPath)) continue

  if (!parentChildren.has(parentPath)) {
    parentChildren.set(parentPath, [])
  }

  parentChildren.get(parentPath).push(routePath)
}

const outletRegex = /<\s*Outlet(?:\s|\/|>)/
let errors = 0
for (const [parentPath, children] of parentChildren.entries()) {
  const parentRoute = routes.get(parentPath)
  if (!parentRoute) continue

  const hasOutlet = outletRegex.test(parentRoute.content)
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
