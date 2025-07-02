import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/__app_layout/library/search/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/__app_layout/library/search/"!</div>
}
