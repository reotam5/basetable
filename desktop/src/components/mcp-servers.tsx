import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { use } from "@/hooks/use"
import { ChevronDown, ChevronLeft, ChevronRight, Download, Server, Trash2 } from "lucide-react"
import { useState } from "react"

export function MCPServers() {
  // Tab state
  const [activeTab, setActiveTab] = useState('installed')

  // State for installed servers
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const [uninstallDialogOpen, setUninstallDialogOpen] = useState(false)
  const [serverToUninstall, setServerToUninstall] = useState<any | null>(null)

  // Pagination state for installed servers
  const [installedCurrentPage, setInstalledCurrentPage] = useState(1)
  const [installedItemsPerPage] = useState(5)

  // State for available servers
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set())

  // Pagination state for available servers
  const [availableCurrentPage, setAvailableCurrentPage] = useState(1)
  const [availableItemsPerPage] = useState(5)

  // Fetch all servers
  const { data: servers, refetch } = use({ fetcher: async () => await window.electronAPI.mcp.getAll() })

  // Filter servers by installed state
  const installedServers = servers?.filter(server => server?.users?.[0]?.User_MCP?.is_installed) ?? []
  const availableServers = servers?.filter(server => !server?.users?.[0]?.User_MCP?.is_installed) ?? []

  // Filter available servers based on search query
  const filteredAvailableServers = availableServers.filter(server =>
    server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    server.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    server.tools?.some(tool => tool.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Calculate pagination for installed servers
  const installedTotalPages = Math.ceil(installedServers.length / installedItemsPerPage)
  const installedPaginatedServers = installedServers.slice(
    (installedCurrentPage - 1) * installedItemsPerPage,
    installedCurrentPage * installedItemsPerPage
  )

  // Calculate pagination for available servers
  const availableTotalPages = Math.ceil(filteredAvailableServers.length / availableItemsPerPage)
  const availablePaginatedServers = filteredAvailableServers.slice(
    (availableCurrentPage - 1) * availableItemsPerPage,
    availableCurrentPage * availableItemsPerPage
  )

  // Handler functions
  const toggleServer = (serverName: string, is_active) => {
    window.electronAPI.mcp.setActiveState(serverName, is_active).then(() => {
      refetch()
    })
  }

  const handleUninstallClick = (server: any) => {
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
      refetch().then(() => {
        // After uninstalling, check if current page has no servers and adjust
        const newInstalledServers = servers?.filter(server => server?.users?.[0]?.User_MCP?.is_installed) ?? []
        const newTotalPages = Math.ceil(newInstalledServers.length / installedItemsPerPage)

        if (installedCurrentPage > newTotalPages && newTotalPages > 0) {
          setInstalledCurrentPage(newTotalPages)
        } else if (newInstalledServers.length === 0) {
          setInstalledCurrentPage(1)
        }
      })
    })
  }

  const installServer = (serverName: string) => {
    window.electronAPI.mcp.install(serverName).then(() => {
      refetch().then(() => {
        // After installing, check if current page has no servers and adjust
        const newAvailableServers = servers?.filter(server => !server?.users?.[0]?.User_MCP?.is_installed) ?? []
        const filteredServers = newAvailableServers.filter(server =>
          server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          server.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          server.tools?.some(tool => tool.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        const newTotalPages = Math.ceil(filteredServers.length / availableItemsPerPage)

        if (availableCurrentPage > newTotalPages && newTotalPages > 0) {
          setAvailableCurrentPage(newTotalPages)
        } else if (filteredServers.length === 0) {
          setAvailableCurrentPage(1)
        }
      })
    })
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

  const toggleTools = (serverId: string) => {
    setExpandedTools(prev => {
      const newSet = new Set(prev)
      if (newSet.has(serverId)) {
        newSet.delete(serverId)
      } else {
        newSet.add(serverId)
      }
      return newSet
    })
  }

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-600 dark:text-red-400'
      case 'warning': return 'text-yellow-600 dark:text-yellow-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  // Render component
  return (
    <div className="mx-auto p-6 max-w-5xl">
      <div className="border-b pb-6 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">MCP Servers</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Manage Model Context Protocol servers to extend AI capabilities
        </p>
      </div>

      <Tabs value={activeTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 gap-0.5 h-auto p-0.5">
          <TabsTrigger
            value="installed"
            className="flex items-center gap-2 text-sm h-8 px-3"
            onClick={() => setActiveTab('installed')}
          >
            <Server className="w-4 h-4" />
            Installed Servers
          </TabsTrigger>
          <TabsTrigger
            value="available"
            className="flex items-center gap-2 text-sm h-8 px-3"
            onClick={() => setActiveTab('available')}
          >
            <Download className="w-4 h-4" />
            Available Servers
          </TabsTrigger>
        </TabsList>

        {/* Installed Servers Content */}
        {activeTab === 'installed' && (
          <div className="space-y-4">
            {installedServers.length === 0 ? (
              <div className="border border-border rounded-lg p-8 text-center">
                <p className="text-muted-foreground">No servers installed yet</p>
                {/* Fixed-height pagination container when no installed servers */}
                <div className="h-10 mt-4">
                  <div />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {installedPaginatedServers.map((server) => (
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
                                  checked={server?.users?.[0]?.User_MCP?.is_active}
                                  onCheckedChange={(checked) => toggleServer(server.name, checked)}
                                />
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{server.description}</p>
                            {server.tools && server.tools.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                  {server.tools.slice(0, expandedTools.has(server.id) ? server.tools.length : 6).map((tool) => (
                                    <Badge key={tool} variant="outline" className="text-xs">
                                      {tool}
                                    </Badge>
                                  ))}
                                </div>
                                {server.tools.length > 6 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleTools(server.id)}
                                    className="h-auto text-xs py-1 px-2 -translate-x-4"
                                  >
                                    {expandedTools.has(server.id) ? (
                                      <>
                                        <ChevronDown className="h-3 w-3 mr-1" />
                                        Show less tools
                                      </>
                                    ) : (
                                      <>
                                        <ChevronRight className="h-3 w-3 mr-1" />
                                        Show {server.tools.length - 6} more tools
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            )}
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

                {/* Fixed-height pagination container for installed servers */}
                <div className="h-10">
                  {installedTotalPages > 1 ? (
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInstalledCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={installedCurrentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {installedCurrentPage} of {installedTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInstalledCurrentPage(prev => Math.min(prev + 1, installedTotalPages))}
                        disabled={installedCurrentPage === installedTotalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  ) : <div />}
                </div>
              </>
            )}
          </div>
        )}

        {/* Available Servers Content */}
        {activeTab === 'available' && (
          <div className="space-y-4">
            <div className="flex items-center justify-end">
              <div className="w-64">
                <Input
                  placeholder="Search servers..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setAvailableCurrentPage(1); // Reset to first page when searching
                  }}
                  className="h-9"
                />
              </div>
            </div>

            {filteredAvailableServers.length === 0 ? (
              <div className="border border-border rounded-lg p-8 text-center">
                <p className="text-muted-foreground">
                  {searchQuery ? `No servers found matching "${searchQuery}"` : "No available servers to install"}
                </p>
                {/* Fixed-height pagination container when no available servers */}
                <div className="h-10 mt-4">
                  <div />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {availablePaginatedServers.map((server) => (
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
                            {server.tools && server.tools.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                  {server.tools.slice(0, expandedTools.has(server.id) ? server.tools.length : 4).map((tool) => (
                                    <Badge key={tool} variant="outline" className="text-xs">
                                      {tool}
                                    </Badge>
                                  ))}
                                </div>
                                {server.tools.length > 4 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleTools(server.id)}
                                    className="p-0 h-auto text-xs text-muted-foreground hover:text-foreground"
                                  >
                                    {expandedTools.has(server.id) ? (
                                      <>
                                        <ChevronDown className="h-3 w-3 mr-1" />
                                        Show less tools
                                      </>
                                    ) : (
                                      <>
                                        <ChevronRight className="h-3 w-3 mr-1" />
                                        Show {server.tools.length - 4} more tools
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            )}
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

                {/* Fixed-height pagination container for available servers */}
                <div className="h-10">
                  {availableTotalPages > 1 ? (
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAvailableCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={availableCurrentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {availableCurrentPage} of {availableTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAvailableCurrentPage(prev => Math.min(prev + 1, availableTotalPages))}
                        disabled={availableCurrentPage === availableTotalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  ) : <div />}
                </div>
              </>
            )}
          </div>
        )}
      </Tabs>

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