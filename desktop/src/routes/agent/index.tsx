import { AgentPage } from '@/components/agent-page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/agent/')({
  component: AgentPage,
})
