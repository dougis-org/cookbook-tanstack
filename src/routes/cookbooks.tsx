import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/cookbooks')({
  component: CookbooksLayout,
})

// Layout-only route: child routes (index list, detail, toc) render here.
function CookbooksLayout() {
  return <Outlet />
}
