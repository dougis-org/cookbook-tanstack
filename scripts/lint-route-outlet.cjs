const fs = require('fs')
const path = require('path')

const routesDir = path.join(__dirname, '..', 'src', 'routes')
const files = fs.readdirSync(routesDir).filter((f) => f.endsWith('.tsx'))

const childRoutes = new Map()

for (const file of files) {
  const content = fs.readFileSync(path.join(routesDir, file), 'utf8')
  const matchRoute = content.match(/createFileRoute\('([^']+)'\)/)
  if (!matchRoute) continue
  const routePath = matchRoute[1]

  if (routePath.includes('$')) {
    const segments = routePath.split('/')
    const dollarIndex = segments.findIndex((segment) => segment.startsWith('$'))
    // Only treat as a child route if there are additional segments beyond the param segment.
    if (dollarIndex !== -1 && dollarIndex < segments.length - 1) {
      const parent = segments.slice(0, dollarIndex + 1).join('/') || '/'
      childRoutes.set(routePath, { file, parent })
    }
  }
}

let errors = 0
for (const [childPath, info] of childRoutes.entries()) {
  const parentFile = files.find((file) => {
    const content = fs.readFileSync(path.join(routesDir, file), 'utf8')
    const matchRoute = content.match(/createFileRoute\('([^']+)'\)/)
    if (!matchRoute) return false
    return matchRoute[1] === info.parent
  })

  if (!parentFile) continue

  const parentContent = fs.readFileSync(path.join(routesDir, parentFile), 'utf8')
  if (!parentContent.includes('<Outlet />') && !parentContent.includes('Outlet')) {
    console.error(`✖ Parent route ${info.parent} (${parentFile}) has child ${childPath} but no <Outlet />`)
    errors++
  }
}

if (errors > 0) {
  console.error(`${errors} route outlet issue(s) found`)
  process.exit(1)
}

console.log('✓ route outlet lint passed')
process.exit(0)
