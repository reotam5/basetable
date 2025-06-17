import { AgentPage } from '@/components/agent-page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/__app_layout/agent/$agentId')({
  component: AgentPage,
})