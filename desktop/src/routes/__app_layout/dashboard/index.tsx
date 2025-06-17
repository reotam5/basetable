import { Dashboard } from '@/components/dashboard'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/__app_layout/dashboard/')({
    component: Dashboard,
})