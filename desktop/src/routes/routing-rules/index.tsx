import { RoutingRules } from '@/components/routing-rules'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/routing-rules/')({
    component: RoutingRules,
})
