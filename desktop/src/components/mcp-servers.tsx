import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { use } from "@/hooks/use"
import { AlertTriangle, ChevronDown, ChevronLeft, ChevronRight, Download, Loader2, RefreshCw, Server, Trash2, X } from "lucide-react"
import { useState } from "react"

export function MCPServers() {
  // Fetch all servers from database
  const { data: servers, refetch, isLoading, error } = use({ fetcher: async () => await window.electronAPI.mcp.getAll() })

  // Tab state
  const [activeTab, setActiveTab] = useState('installed')

  // State for MCP host status and tools
  const [addServerDialogOpen, setAddServerDialogOpen] = useState(false)
  const [newServerConfig, setNewServerConfig] = useState({
    command: '',
    args: '',
    env: ''
  })

  // Error states
  const [operationError, setOperationError] = useState<string | null>(null)
  const [loadingOperations, setLoadingOperations] = useState<Set<string>>(new Set())
  const [formError, setFormError] = useState<string | null>(null)

  // Other state
  const [uninstallDialogOpen, setUninstallDialogOpen] = useState(false)
  const [serverToUninstall, setServerToUninstall] = useState<NonNullable<typeof servers>[number] | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set())

  // Filter servers by installed state
  const installedServers = servers?.filter(server => server?.is_installed) ?? []
  const availableServers = servers?.filter(server => !server?.is_installed) ?? []

  // Filter available servers based on search query
  const filteredAvailableServers = availableServers.filter(server =>
    server?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    server?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    server?.available_tools?.some(tool => tool?.name.toLowerCase().includes(searchQuery.toLowerCase()))
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

  // Utility functions for error and loading management
  const setOperationLoading = (operationId: string, loading: boolean) => {
    setLoadingOperations(prev => {
      const newSet = new Set(prev)
      if (loading) {
        newSet.add(operationId)
      } else {
        newSet.delete(operationId)
      }
      return newSet
    })
  }

  const clearOperationError = () => setOperationError(null)

  const validateServerConfig = () => {
    if (!newServerConfig.command.trim()) {
      setFormError('Command is required')
      return false
    }

    if (newServerConfig.env) {
      try {
        JSON.parse(newServerConfig.env)
      } catch {
        setFormError('Environment variables must be valid JSON')
        return false
      }
    }

    setFormError(null)
    return true
  }

  // Handler functions
  const toggleServer = async (serverId: number, is_active: boolean) => {
    const operationId = `toggle-${serverId}`
    try {
      setOperationLoading(operationId, true)
      setOperationError(null)
      await window.electronAPI.mcp.setActiveState(serverId, is_active)
      refetch()
    } catch (error) {
      setOperationError(`Failed to ${is_active ? 'activate' : 'deactivate'} server: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setOperationLoading(operationId, false)
    }
  }

  const handleUninstallClick = (server: typeof serverToUninstall) => {
    setServerToUninstall(server)
    setUninstallDialogOpen(true)
    setOperationError(null)
  }

  const confirmUninstall = async () => {
    if (serverToUninstall) {
      await uninstallServer(serverToUninstall.id)
      setUninstallDialogOpen(false)
      setServerToUninstall(null)
    }
  }

  const cancelUninstall = () => {
    setUninstallDialogOpen(false)
    setServerToUninstall(null)
    setOperationError(null)
  }

  const uninstallServer = async (serverId: number) => {
    const operationId = `uninstall-${serverId}`
    try {
      setOperationLoading(operationId, true)
      setOperationError(null)
      await window.electronAPI.mcp.uninstall(serverId)
      refetch()
    } catch (error) {
      setOperationError(`Failed to uninstall server: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setOperationLoading(operationId, false)
    }
  }

  const installServer = async (serverId: number) => {
    const operationId = `install-${serverId}`
    try {
      setOperationLoading(operationId, true)
      setOperationError(null)
      await window.electronAPI.mcp.install(serverId)
      refetch()
    } catch (error) {
      setOperationError(`Failed to install server: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setOperationLoading(operationId, false)
    }
  }

  const addServer = async () => {
    if (!validateServerConfig()) return

    const operationId = 'add-server'
    try {
      setOperationLoading(operationId, true)
      setFormError(null)
      await window.electronAPI.mcp.createNewMcp({
        server_config: {
          command: newServerConfig.command,
          args: newServerConfig.args?.split(' ') ?? [],
          env: newServerConfig.env ? JSON.parse(newServerConfig.env) : {}
        },
      })
      refetch()
      setAddServerDialogOpen(false)
      setNewServerConfig({
        command: '',
        args: '',
        env: ''
      })
    } catch (error) {
      setFormError(`Failed to add server: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setOperationLoading(operationId, false)
    }
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
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">MCP Servers</h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Manage Model Context Protocol servers to extend AI capabilities
            </p>
          </div>
          <Button
            onClick={() => {
              setAddServerDialogOpen(true)
              setFormError(null)
              setOperationError(null)
            }}
            size="sm"
            className="flex items-center gap-2 mt-1"
          >
            <Server className="h-4 w-4" />
            Add MCP Server
          </Button>
        </div>
      </div>

      {/* Global Error Display */}
      {(error || operationError) && (
        <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">
                {error ? 'Failed to load servers. Please try refreshing the page.' : operationError}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearOperationError}
              className="h-auto p-1 text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {error && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-3 text-red-700 border-red-300 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading servers...</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && (
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
                  <div className="space-y-4">
                    <div>
                      <Server className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground mt-2">No servers installed yet</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        Get started by installing your first MCP server to extend AI capabilities
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setActiveTab('available')
                        resetPage()
                      }}
                      className="mx-auto"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Add your first MCP server
                    </Button>
                  </div>
                  {/* Fixed-height pagination container when no installed servers */}
                  <div className="h-10 mt-4">
                    <div />
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {paginatedServers.map((server) => (
                      <div key={server.id} className="border border-border rounded-lg p-4 bg-background">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <img
                              src={server?.icon || ''}
                              alt={`${server?.name} logo`}
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-sm font-medium text-foreground">{server?.name}</h3>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-muted-foreground">Active</span>
                                  <Switch
                                    checked={server?.is_active}
                                    onCheckedChange={(checked) => toggleServer(server.id, checked)}
                                    disabled={loadingOperations.has(`toggle-${server.id}`)}
                                  />
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">{server?.description}</p>
                              {server?.available_tools && server.available_tools.length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex flex-wrap gap-2">
                                    {server.available_tools.slice(0, expandedTools.has(server.id.toString()) ? server.available_tools.length : 6).map((tool) => (
                                      <Badge key={tool.id} variant="outline" className="text-xs">
                                        {tool.title || tool.name}
                                      </Badge>
                                    ))}
                                  </div>
                                  {server.available_tools.length > 6 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleTools(server.id.toString())}
                                      className="h-auto text-xs py-1 px-2 -translate-x-4"
                                    >
                                      {expandedTools.has(server.id.toString()) ? (
                                        <>
                                          <ChevronDown className="h-3 w-3 mr-1" />
                                          Show less tools
                                        </>
                                      ) : (
                                        <>
                                          <ChevronRight className="h-3 w-3 mr-1" />
                                          Show {server.available_tools.length - 6} more tools
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
                              disabled={loadingOperations.has(`uninstall-${server.id}`)}
                            >
                              {loadingOperations.has(`uninstall-${server.id}`) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
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
                      <div key={server.id} className="border border-border rounded-lg p-4 bg-background">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <img
                              src={server?.icon || ''}
                              alt={`${server?.name} logo`}
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-foreground mb-2">{server?.name}</h3>
                              <p className="text-sm text-muted-foreground mb-3">{server?.description}</p>
                              {server?.available_tools && server.available_tools.length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex flex-wrap gap-2">
                                    {server.available_tools.slice(0, expandedTools.has(server.id.toString()) ? server.available_tools.length : 4).map((tool) => (
                                      <Badge key={tool.id} variant="outline" className="text-xs">
                                        {tool.title}
                                      </Badge>
                                    ))}
                                  </div>
                                  {server.available_tools.length > 4 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleTools(server.id.toString())}
                                      className="p-0 h-auto text-xs text-muted-foreground hover:text-foreground"
                                    >
                                      {expandedTools.has(server.id.toString()) ? (
                                        <>
                                          <ChevronDown className="h-3 w-3 mr-1" />
                                          Show less tools
                                        </>
                                      ) : (
                                        <>
                                          <ChevronRight className="h-3 w-3 mr-1" />
                                          Show {server.available_tools.length - 4} more tools
                                        </>
                                      )}
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() => installServer(server!.id)}
                            size="sm"
                            className="ml-4"
                            disabled={loadingOperations.has(`install-${server!.id}`)}
                          >
                            {loadingOperations.has(`install-${server!.id}`) ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4 mr-2" />
                            )}
                            {loadingOperations.has(`install-${server!.id}`) ? 'Installing...' : 'Install'}
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
      )}

      {/* Add Server Dialog */}
      <Dialog open={addServerDialogOpen} onOpenChange={setAddServerDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add MCP Server</DialogTitle>
            <DialogDescription>
              Configure a new Model Context Protocol server to extend AI capabilities
            </DialogDescription>
          </DialogHeader>

          {/* Form Error Display */}
          {formError && (
            <div className="p-3 border border-red-200 bg-red-50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{formError}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Command</label>
              <Input
                placeholder="e.g., npx or python3"
                value={newServerConfig.command}
                onChange={(e) => {
                  setNewServerConfig(prev => ({ ...prev, command: e.target.value }))
                  if (formError && e.target.value.trim()) {
                    setFormError(null)
                  }
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Arguments</label>
              <Input
                placeholder="e.g., -y @modelcontextprotocol/server-filesystem /path/to/directory"
                value={newServerConfig.args}
                onChange={(e) => setNewServerConfig(prev => ({ ...prev, args: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Environment Variables (JSON)</label>
              <Input
                placeholder='e.g., {"API_KEY": "your-key", "NODE_ENV": "production"}'
                value={newServerConfig.env}
                onChange={(e) => {
                  setNewServerConfig(prev => ({ ...prev, env: e.target.value }))
                  if (formError && e.target.value === '') {
                    setFormError(null)
                  }
                }}
              />
            </div>
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
              <p className="font-medium mb-1">Example configurations:</p>
              <p><strong>File System:</strong> npx -y @modelcontextprotocol/server-filesystem /path/to/directory</p>
              <p><strong>Brave Search:</strong> npx -y @modelcontextprotocol/server-brave-search</p>
              <p><strong>GitHub:</strong> npx -y @modelcontextprotocol/server-github</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddServerDialogOpen(false)
              setFormError(null)
            }}>
              Cancel
            </Button>
            <Button
              onClick={addServer}
              disabled={!newServerConfig.command || loadingOperations.has('add-server')}
            >
              {loadingOperations.has('add-server') ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Server'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <Button
              variant="destructive"
              onClick={confirmUninstall}
              disabled={serverToUninstall ? loadingOperations.has(`uninstall-${serverToUninstall.id}`) : false}
            >
              {serverToUninstall && loadingOperations.has(`uninstall-${serverToUninstall.id}`) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uninstalling...
                </>
              ) : (
                'Uninstall'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}