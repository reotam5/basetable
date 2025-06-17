import { createFileRoute } from '@tanstack/react-router'
import { MCPServers } from '@/components/mcp-servers'

export const Route = createFileRoute('/__app_layout/mcp-servers/')({
    component: MCPServers
})