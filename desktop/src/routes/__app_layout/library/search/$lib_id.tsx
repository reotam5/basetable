import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/__app_layout/library/search/$lib_id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/__app_layout/library/search/$lib_id"!</div>
}
