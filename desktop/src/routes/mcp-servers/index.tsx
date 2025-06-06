import { createFileRoute } from '@tanstack/react-router'
import { MCPServers } from '@/components/mcp-servers'

export const Route = createFileRoute('/mcp-servers/')({
    component: MCPServers
})