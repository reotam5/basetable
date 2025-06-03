import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { use } from "@/hooks/use"
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
}

interface LogEntry {
  id: string
  message: string
  timestamp: string
  type: 'info' | 'warning' | 'error'
}

export function MCPServers() {
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const [uninstallDialogOpen, setUninstallDialogOpen] = useState(false)
  const [serverToUninstall, setServerToUninstall] = useState<MCPServer | null>(null)

  const { data: servers, refetch } = use({ fetcher: async () => await window.electronAPI.mcp.getAll() })

  const installedServers = servers?.filter(server => server.is_installed) ?? []
  const availableServers = servers?.filter(server => !server.is_installed) ?? []

  const toggleServer = (serverName: string, is_active) => {
    window.electronAPI.mcp.setActiveState(serverName, is_active).then(() => {
      refetch()
    })
  }

  const installServer = (serverName: string) => {
    window.electronAPI.mcp.install(serverName).then(() => {
      refetch()
    })
  }

  const handleUninstallClick = (server: MCPServer) => {
    setServerToUninstall(server)
    setUninstallDialogOpen(true)
  }

  const confirmUninstall = () => {
    if (serverToUninstall) {
      uninstallServer(serverToUninstall.name)
      setUninstallDialogOpen(false)
      setServerToUninstall(null)
    }
  }

  const cancelUninstall = () => {
    setUninstallDialogOpen(false)
    setServerToUninstall(null)
  }

  const uninstallServer = (serverName: string) => {
    window.electronAPI.mcp.uninstall(serverName).then(() => {
      refetch()
    })
  }

  const toggleLogs = (serverName: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(serverName)) {
        newSet.delete(serverName)
      } else {
        newSet.add(serverName)
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
                      src={server.icon}
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
                            checked={server.is_active}
                            onCheckedChange={(checked) => toggleServer(server.name, checked)}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{server.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {server.tools.map((tool) => (
                          <Badge key={tool} variant="outline" className="text-xs">
                            {tool}
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
        {availableServers.length === 0 ? (
          <div className="border border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground">No available servers to install</p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableServers.map((server) => (
              <div key={server.id} className="border border-border rounded-lg p-4 bg-background">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <img
                      src={server.icon}
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
                        {server.tools.map((tool) => (
                          <Badge key={tool} variant="outline" className="text-xs">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => installServer(server.name)}
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
        )}
      </div>

      {/* Uninstall Confirmation Dialog */}
      <Dialog open={uninstallDialogOpen} onOpenChange={setUninstallDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uninstall {serverToUninstall?.name}?</DialogTitle>
            <DialogDescription>
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