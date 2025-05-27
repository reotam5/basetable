import { MCPServers } from '@/components/mcp-servers'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/mcp-servers/')({
    component: MCPServers,
})