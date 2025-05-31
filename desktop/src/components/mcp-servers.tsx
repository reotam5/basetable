

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { ChevronDown, ChevronRight, Download, Trash2 } from "lucide-react"
import { useState } from "react"

interface MCPServer {
  id: string
  name: string
  description: string
  capabilities: string[]
  installed: boolean
  active?: boolean
  logoUrl: string
  logs?: LogEntry[]
  requiresApiKey?: boolean
}

interface LogEntry {
  id: string
  message: string
  timestamp: string
  type: 'info' | 'warning' | 'error'
}

const mockServers: MCPServer[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Access Gmail functionality including reading, sending, and managing emails',
    capabilities: ['Send Email', 'Read Email', 'Search Mail', 'Manage Labels'],
    installed: true,
    active: true,
    requiresApiKey: true,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg',
    logs: [
      { id: '1', message: 'Gmail server connected successfully', timestamp: '2025-05-29 10:30:15', type: 'info' },
      { id: '2', message: 'Sent email to user@example.com', timestamp: '2025-05-29 10:25:32', type: 'info' },
      { id: '3', message: 'Retrieved 25 new messages', timestamp: '2025-05-29 10:20:10', type: 'info' }
    ]
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Integrate with Slack workspaces for messaging and channel management',
    capabilities: ['Send Messages', 'Read Channels', 'File Upload', 'User Management'],
    installed: true,
    active: false,
    requiresApiKey: true,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg',
    logs: [
      { id: '1', message: 'Slack server disconnected', timestamp: '2025-05-29 09:15:20', type: 'warning' }
    ]
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Access GitHub repositories, issues, and pull requests',
    capabilities: ['Repository Access', 'Issue Management', 'Pull Requests', 'Code Search'],
    installed: false,
    requiresApiKey: true,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg'
  },
  {
    id: 'filesystem',
    name: 'File System',
    description: 'Local file system access for reading and writing files',
    capabilities: ['Read Files', 'Write Files', 'Directory Operations', 'File Search'],
    installed: false,
    requiresApiKey: false,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Folder-icon.svg'
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Connect to Notion workspaces for database and page management',
    capabilities: ['Database Access', 'Page Creation', 'Content Search', 'Block Management'],
    installed: false,
    requiresApiKey: true,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png'
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Manage Google Calendar events and scheduling',
    capabilities: ['Event Creation', 'Calendar Access', 'Scheduling', 'Meeting Management'],
    installed: false,
    requiresApiKey: true,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg'
  },
  {
    id: 'aws',
    name: 'AWS Services',
    description: 'Access various Amazon Web Services for cloud operations',
    capabilities: ['S3 Operations', 'Lambda Functions', 'EC2 Management', 'CloudWatch'],
    installed: false,
    requiresApiKey: true,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg'
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    description: 'Connect to PostgreSQL databases for data operations',
    capabilities: ['Query Execution', 'Schema Management', 'Data Import/Export', 'Connection Pooling'],
    installed: false,
    requiresApiKey: false,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Postgresql_elephant.svg'
  }
]

export function MCPServers() {
  const [servers, setServers] = useState<MCPServer[]>(mockServers)
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const [uninstallDialogOpen, setUninstallDialogOpen] = useState(false)
  const [serverToUninstall, setServerToUninstall] = useState<MCPServer | null>(null)

  const installedServers = servers.filter(server => server.installed)
  const availableServers = servers.filter(server => !server.installed)

  const toggleServer = (serverId: string) => {
    setServers(prev => prev.map(server =>
      server.id === serverId
        ? { ...server, active: !server.active }
        : server
    ))
  }

  const installServer = (serverId: string) => {
    setServers(prev => prev.map(server =>
      server.id === serverId
        ? { ...server, installed: true, active: true }
        : server
    ))
  }

  const handleUninstallClick = (server: MCPServer) => {
    if (server.requiresApiKey) {
      setServerToUninstall(server)
      setUninstallDialogOpen(true)
    } else {
      uninstallServer(server.id)
    }
  }

  const confirmUninstall = () => {
    if (serverToUninstall) {
      uninstallServer(serverToUninstall.id)
      setUninstallDialogOpen(false)
      setServerToUninstall(null)
    }
  }

  const cancelUninstall = () => {
    setUninstallDialogOpen(false)
    setServerToUninstall(null)
  }

  const uninstallServer = (serverId: string) => {
    setServers(prev => prev.map(server =>
      server.id === serverId
        ? { ...server, installed: false, active: false, logs: undefined }
        : server
    ))
  }

  const toggleLogs = (serverId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(serverId)) {
        newSet.delete(serverId)
      } else {
        newSet.add(serverId)
      }
      return newSet
    })
  }

  const getLogTypeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return 'text-red-600 dark:text-red-400'
      case 'warning': return 'text-yellow-600 dark:text-yellow-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-8 p-6 mx-auto max-w-5xl">
      <div className="border-b pb-6 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">MCP Servers</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Manage Model Context Protocol servers to extend AI capabilities
        </p>
      </div>

      {/* Installed Servers */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-foreground">Installed Servers</h2>
        {installedServers.length === 0 ? (
          <div className="border border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground">No servers installed yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {installedServers.map((server) => (
              <div key={server.id} className="border border-border rounded-lg p-4 bg-background">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <img
                      src={server.logoUrl}
                      alt={`${server.name} logo`}
                      className="w-6 h-6 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-sm font-medium text-foreground">{server.name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">Active</span>
                          <Switch
                            checked={server.active}
                            onCheckedChange={() => toggleServer(server.id)}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{server.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {server.capabilities.map((capability) => (
                          <Badge key={capability} variant="outline" className="text-xs">
                            {capability}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUninstallClick(server)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {server.logs && server.logs.length > 0 && (
                  <Collapsible open={expandedLogs.has(server.id)} onOpenChange={() => toggleLogs(server.id)}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="mt-3 p-0 text-sm text-muted-foreground hover:text-foreground">
                        {expandedLogs.has(server.id) ? (
                          <ChevronDown className="h-4 w-4 mr-1" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-1" />
                        )}
                        View Recent Logs ({server.logs.length})
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3">
                      <div className="bg-muted/30 rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                        {server.logs.map((log) => (
                          <div key={log.id} className="text-xs flex justify-between items-start">
                            <span className={getLogTypeColor(log.type)}>{log.message}</span>
                            <span className="text-muted-foreground ml-2 whitespace-nowrap">{log.timestamp}</span>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Servers */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-foreground">Available Servers</h2>
        <div className="space-y-3">
          {availableServers.map((server) => (
            <div key={server.id} className="border border-border rounded-lg p-4 bg-background">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <img
                    src={server.logoUrl}
                    alt={`${server.name} logo`}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-foreground mb-2">{server.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{server.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {server.capabilities.map((capability) => (
                        <Badge key={capability} variant="outline" className="text-xs">
                          {capability}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => installServer(server.id)}
                  size="sm"
                  className="ml-4"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Install
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Uninstall Confirmation Dialog */}
      <Dialog open={uninstallDialogOpen} onOpenChange={setUninstallDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uninstall {serverToUninstall?.name}?</DialogTitle>
            <DialogDescription>
              This server requires API keys or authentication credentials. Uninstalling will remove all stored
              credentials and you'll need to reconfigure them if you reinstall this server later.
              <br /><br />
              Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelUninstall}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmUninstall}>
              Uninstall
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}