import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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


  // Other state
  const [uninstallDialogOpen, setUninstallDialogOpen] = useState(false)
  const [serverToUninstall, setServerToUninstall] = useState<{
    user_mcp: {
      id: number;
      user_id: string;
      mcp_id: number;
      is_active: boolean;
      is_installed: boolean;
    };
    mcp: {
      id: number;
      name: string;
      description: string;
      icon: string;
      tools: {
        name: string;
        id: string;
      }[] | null;
    } | null;
  } | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set())

  // Fetch all servers
  const { data: servers, refetch } = use({ fetcher: async () => await window.electronAPI.mcp.getAll() })

  // Filter servers by installed state
  const installedServers = servers?.filter(server => server?.user_mcp?.is_installed) ?? []
  const availableServers = servers?.filter(server => !server?.user_mcp?.is_installed) ?? []

  // Filter available servers based on search query
  const filteredAvailableServers = availableServers.filter(server =>
    server.mcp?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    server.mcp?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    server.mcp?.tools?.some(tool => tool?.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Get current servers based on active tab
  const currentServers = activeTab === 'installed' ? installedServers : filteredAvailableServers

  // Pagination calculation
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const totalPages = Math.ceil(currentServers.length / itemsPerPage)
  const paginatedServers = currentServers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages)

  // Reset to first page when switching tabs or searching
  const resetPage = () => setCurrentPage(1)

  // Handler functions
  const toggleServer = (serverName: string, is_active) => {
    window.electronAPI.mcp.setActiveState(serverName, is_active).then(() => {
      refetch()
    })
  }

  const handleUninstallClick = (server: typeof serverToUninstall) => {
    setServerToUninstall(server)
    setUninstallDialogOpen(true)
  }

  const confirmUninstall = () => {
    if (serverToUninstall) {
      uninstallServer(serverToUninstall.mcp!.name)
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

  const installServer = (serverName: string) => {
    window.electronAPI.mcp.install(serverName).then(() => {
      refetch()
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
            onClick={() => {
              setActiveTab('installed')
              resetPage()
            }}
          >
            <Server className="w-4 h-4" />
            Installed Servers
          </TabsTrigger>
          <TabsTrigger
            value="available"
            className="flex items-center gap-2 text-sm h-8 px-3"
            onClick={() => {
              setActiveTab('available')
              resetPage()
            }}
          >
            <Download className="w-4 h-4" />
            Available Servers
          </TabsTrigger>
        </TabsList>

        {/* Installed Servers Content */}
        {activeTab === 'installed' && (
          <div className="space-y-4">
            {currentServers.length === 0 ? (
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
                  {paginatedServers.map((server) => (
                    <div key={server.user_mcp.id} className="border border-border rounded-lg p-4 bg-background">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <img
                            src={server.mcp?.icon}
                            alt={`${server.mcp?.name} logo`}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-sm font-medium text-foreground">{server.mcp?.name}</h3>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-muted-foreground">Active</span>
                                <Switch
                                  checked={server?.user_mcp.is_active}
                                  onCheckedChange={(checked) => toggleServer(server.mcp!.name, checked)}
                                />
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{server.mcp?.description}</p>
                            {server.mcp?.tools && server.mcp.tools.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                  {server.mcp.tools.slice(0, expandedTools.has(server.user_mcp.id.toString()) ? server.mcp.tools.length : 6).map((tool) => (
                                    <Badge key={tool.id} variant="outline" className="text-xs">
                                      {tool.name}
                                    </Badge>
                                  ))}
                                </div>
                                {server.mcp.tools.length > 6 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleTools(server.user_mcp.id.toString())}
                                    className="h-auto text-xs py-1 px-2 -translate-x-4"
                                  >
                                    {expandedTools.has(server.user_mcp.id.toString()) ? (
                                      <>
                                        <ChevronDown className="h-3 w-3 mr-1" />
                                        Show less tools
                                      </>
                                    ) : (
                                      <>
                                        <ChevronRight className="h-3 w-3 mr-1" />
                                        Show {server.mcp.tools.length - 6} more tools
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
                    </div>
                  ))}
                </div>

                {/* Fixed-height pagination container for installed servers */}
                <div className="h-10">
                  {totalPages > 1 ? (
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
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
                    resetPage(); // Reset to first page when searching
                  }}
                  className="h-9"
                />
              </div>
            </div>

            {currentServers.length === 0 ? (
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
                  {paginatedServers.map((server) => (
                    <div key={server.user_mcp.id} className="border border-border rounded-lg p-4 bg-background">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <img
                            src={server.mcp?.icon}
                            alt={`${server.mcp?.name} logo`}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-foreground mb-2">{server.mcp?.name}</h3>
                            <p className="text-sm text-muted-foreground mb-3">{server.mcp?.description}</p>
                            {server.mcp?.tools && server.mcp.tools.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                  {server.mcp.tools.slice(0, expandedTools.has(server.user_mcp.id.toString()) ? server.mcp.tools.length : 4).map((tool) => (
                                    <Badge key={tool.id} variant="outline" className="text-xs">
                                      {tool.name}
                                    </Badge>
                                  ))}
                                </div>
                                {server.mcp.tools.length > 4 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleTools(server.user_mcp.id.toString())}
                                    className="p-0 h-auto text-xs text-muted-foreground hover:text-foreground"
                                  >
                                    {expandedTools.has(server.user_mcp.id.toString()) ? (
                                      <>
                                        <ChevronDown className="h-3 w-3 mr-1" />
                                        Show less tools
                                      </>
                                    ) : (
                                      <>
                                        <ChevronRight className="h-3 w-3 mr-1" />
                                        Show {server.mcp.tools.length - 4} more tools
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => installServer(server.mcp!.name.toString())}
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
                  {totalPages > 1 ? (
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
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
            <DialogTitle>Uninstall {serverToUninstall?.mcp?.name}?</DialogTitle>
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