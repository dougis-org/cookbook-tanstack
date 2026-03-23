const fs = require("fs");
const path = require("path");

const routesDir = path.join(__dirname, "..", "src", "routes");

function collectRouteFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectRouteFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".tsx")) {
      files.push(fullPath);
    }
  }

  return files;
}

function normalizeRoutePath(routePath) {
  if (routePath === "/") return "/";
  // Keep leading slash, drop trailing slash
  return routePath.replace(/\/+$/g, "");
}

const routeRegex = /createFileRoute\(\s*(['"])([^'"]+)\1\s*\)/g;
const files = collectRouteFiles(routesDir);

// Collect all route definitions.
// Multiple files can normalize to the same path (e.g. a layout route at
// "/cookbooks" and an index route at "/cookbooks/"). Track whether each entry
// is an index route (trailing slash) or a layout route (no trailing slash).
// Only layout routes can be required to provide <Outlet /> for their children.
const routes = new Map(); // Map<routePath, { file, content, isLayout }[]>
for (const filePath of files) {
  const content = fs.readFileSync(filePath, "utf8");

  for (const matchRoute of content.matchAll(routeRegex)) {
    const rawRoutePath = matchRoute[2];
    const routePath = normalizeRoutePath(rawRoutePath);
    const file = path.relative(routesDir, filePath);
    // A trailing slash in the raw path marks this as an index route, not a layout.
    const isLayout = rawRoutePath === "/" || !rawRoutePath.endsWith("/");
    if (!routes.has(routePath)) {
      routes.set(routePath, []);
    }
    routes.get(routePath).push({ file, content, isLayout });
  }
}

// Build parent -> children map based on path hierarchy
const parentChildren = new Map();
for (const routePath of routes.keys()) {
  if (routePath === "/") continue;

  const parentPath = normalizeRoutePath(path.posix.dirname(routePath));
  if (!parentPath || parentPath === "/") continue;

  if (!routes.has(parentPath)) continue;

  if (!parentChildren.has(parentPath)) {
    parentChildren.set(parentPath, []);
  }

  parentChildren.get(parentPath).push(routePath);
}

const outletRegex = /<\s*Outlet(?:\s|\/|>)/;
let errors = 0;
for (const [parentPath, children] of parentChildren.entries()) {
  const parentRoutes = routes.get(parentPath);
  if (!parentRoutes) continue;

  // Only layout routes (non-trailing-slash paths) are required to render
  // <Outlet />. If every file at this path is an index route, the children
  // are actually root siblings in TanStack Router — skip the check.
  const layoutRoutes = parentRoutes.filter((r) => r.isLayout);
  if (layoutRoutes.length === 0) continue;

  const hasOutlet = layoutRoutes.some((r) => outletRegex.test(r.content));
  if (!hasOutlet) {
    const files = layoutRoutes.map((r) => r.file).join(", ");
    console.error(
      `✖ Parent route ${parentPath} (${files}) has child route(s) ${children.join(", ")} but no <Outlet />`,
    );
    errors++;
  }
}

if (errors > 0) {
  console.error(`\n${errors} route outlet issue(s) found.`);
  process.exit(1);
}

console.log("✓ route outlet lint passed");
process.exit(0);
