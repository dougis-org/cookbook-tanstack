import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/categories')({
  component: CategoriesLayout,
})

// Layout-only route: child routes (index list, detail) render here.
function CategoriesLayout() {
  return <Outlet />
}
