import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { use } from "@/hooks/use"
import { useBlocker } from "@tanstack/react-router"
import { Bot, Loader2, Plus, Upload, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"


interface LibraryEntry {
  title: string
  description: string
  agents: Awaited<ReturnType<typeof window.electronAPI.agent.getAllAgentsWithTools>>
}

export function LibraryPublishPage() {
  const { data: agents, isLoading } = use({
    fetcher: useCallback(() => window.electronAPI.agent.getAllAgentsWithTools(), [])
  })

  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<number>>(new Set())
  const [libraryEntry, setLibraryEntry] = useState<LibraryEntry>({
    title: '',
    description: '',
    agents: []
  })
  const [isPublishing, setIsPublishing] = useState(false)
  const [newCapability, setNewCapability] = useState('')
  const [capabilities, setCapabilities] = useState<Record<string, string[]>>({})

  // Track unsaved changes for navigation blocking
  const [hasChanges, setHasChanges] = useState(false)
  const [showNavigationDialog, setShowNavigationDialog] = useState(false)

  // Block navigation when there are unsaved changes
  const { proceed, reset, status } = useBlocker({
    shouldBlockFn: () => hasChanges,
    withResolver: true
  })

  // Show navigation dialog when navigation is blocked
  useEffect(() => {
    setShowNavigationDialog(status === 'blocked')
  }, [status])

  // Handle browser window close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  // Update hasChanges when form data changes
  useEffect(() => {
    const formHasData = !!(libraryEntry.title.trim() ||
      libraryEntry.description.trim() ||
      selectedAgentIds.size > 0 ||
      Object.values(capabilities).flatMap(c => c).length > 0)
    setHasChanges(formHasData)
  }, [libraryEntry.title, libraryEntry.description, selectedAgentIds, capabilities])

  const handleAgentSelection = (agentId: number, checked: boolean) => {
    const newSelectedIds = new Set(selectedAgentIds)

    if (checked) {
      newSelectedIds.add(agentId)
      const agent = availableAgents.find(a => a.id === agentId)
      if (agent) {
        setLibraryEntry(prev => ({
          ...prev,
          agents: [...prev.agents, agent]
        }))

        for (const capability of generateAgentCapabilities(agent)) {
          handleAddCapability(agentId.toString(), capability)
        }
      }
    } else {
      newSelectedIds.delete(agentId)
      setLibraryEntry(prev => ({
        ...prev,
        agents: prev.agents.filter(a => a.id !== agentId)
      }))
      setCapabilities(prev => {
        delete prev[agentId.toString()]
        return {
          ...prev,
        }
      })
    }

    setSelectedAgentIds(newSelectedIds)
  }

  const handleAddCapability = (key: string, capability: string) => {
    const trimmedCapability = capability.trim()
    if (trimmedCapability) {
      setCapabilities(prev => {
        for (const capabilities of Object.values(prev)) {
          if (capabilities.includes(trimmedCapability)) {
            // If the capability already exists, skip adding
            return prev
          }
        }

        return {
          ...prev,
          [key]: [...(prev?.[key] || []), trimmedCapability]
        }
      })
    }
  }

  const handleRemoveCapability = (capability: string) => {
    setCapabilities(prev => {
      return Object.fromEntries(
        Object.entries(prev).map(([key, caps]) => [
          key,
          caps.filter(c => c !== capability)
        ])
      )
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddCapability('custom', newCapability)
      setNewCapability('')
    }
  }

  // Update hasChanges when form data changes
  useEffect(() => {
    const formHasData = !!(libraryEntry.title.trim() ||
      libraryEntry.description.trim() ||
      selectedAgentIds.size > 0 ||
      Object.values(capabilities).flatMap(c => c).length > 0)
    setHasChanges(formHasData)
  }, [libraryEntry.title, libraryEntry.description, selectedAgentIds, capabilities])

  const handleNavigationConfirm = () => {
    setHasChanges(false)
    proceed?.()
  }

  const handleNavigationCancel = () => {
    reset?.()
  }

  const handlePublish = async () => {
    if (!libraryEntry.title.trim() || !libraryEntry.description.trim() || selectedAgentIds.size === 0) {
      toast.error("Please fill in all required fields and select at least one agent")
      return
    }

    setIsPublishing(true)
    try {
      // Simulate API call to publish to library
      await new Promise(resolve => setTimeout(resolve, 2000))

      toast.success("Successfully published to library!", {
        icon: <Upload className="h-4 w-4" />,
        description: "Your agent collection is now available for others to use.",
      })

      // Reset form
      setSelectedAgentIds(new Set())
      setLibraryEntry({
        title: '',
        description: '',
        agents: []
      })
      setCapabilities({})
      setNewCapability('')
      setHasChanges(false) // Clear unsaved changes flag

    } catch {
      toast.error("Failed to publish to library")
    } finally {
      setIsPublishing(false)
    }
  }

  const isFormValid = libraryEntry.title.trim() &&
    libraryEntry.description.trim() &&
    selectedAgentIds.size > 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading agents...</span>
        </div>
      </div>
    )
  }

  const generateAgentCapabilities = (agent: LibraryEntry['agents'][number]): string[] => {
    const capabilities: string[] = []

    // Add capabilities based on MCP tools
    if (agent.mcps && agent.mcps.length > 0) {
      agent.mcps.forEach(mcp => {
        if (mcp.selectedTools && mcp.selectedTools.length > 0) {
          // Add specific tool capabilities
          mcp.selectedTools.forEach(tool => {
            if (tool.name && tool.description) {
              // Create a more descriptive capability from tool name
              const toolCapability = (mcp.name + ": " + tool.name)
                .replace(/_/g, ' ')
                .replace(/-/g, ' ')
                .replace(/([A-Z])/g, ' $1')
                .trim()
                .toLowerCase()
              capabilities.push(toolCapability)
            }
          })
        }
      })
    }

    return capabilities
  }

  const availableAgents = agents?.filter(agent => !agent.is_main) || []

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      <div className="flex-1 space-y-8 p-6 mx-auto max-w-5xl w-full flex flex-col">
        {/* Header */}
        <div className="border-b pb-6">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            Share Your Agent
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Share your agents with the community.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Library Entry Details */}
            <Card>
              <CardHeader>
                <CardTitle>Library Entry Details</CardTitle>
                <CardDescription>
                  Provide information about your agent collection that will be visible to other users.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={libraryEntry.title}
                    onChange={(e) => setLibraryEntry(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Development Team Assistant"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={libraryEntry.description}
                    onChange={(e) => setLibraryEntry(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what your agent collection does and how it can help users..."
                    className="w-full h-24"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Agent Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Agents *</CardTitle>
                <CardDescription>
                  Choose the agents you want to include in your library entry.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {availableAgents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No agents available to publish</p>
                    <p className="text-sm">Create some agents first to add them to the library</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableAgents.map((agent) => (
                      <Label
                        htmlFor={`agent-${agent.id}`}
                        key={agent.id}
                        className={`border rounded-lg p-4 transition-colors ${selectedAgentIds.has(agent.id) ? 'bg-muted/50 border-primary/30' : 'hover:bg-muted/30'
                          }`}
                      >
                        <Checkbox
                          id={`agent-${agent.id}`}
                          checked={selectedAgentIds.has(agent.id)}
                          onCheckedChange={(checked) => handleAgentSelection(agent.id, checked as boolean)}
                        />
                        {agent.name}
                      </Label>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col">
            {/* Capabilities */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Capabilities</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col">
                {/* Add custom capability */}
                <div className="space-y-2">
                  <Label htmlFor="new-capability" className="text-xs text-muted-foreground">
                    Add capability
                  </Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="new-capability"
                      value={newCapability}
                      onChange={(e) => setNewCapability(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="e.g., data analysis"
                      className="text-xs"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        handleAddCapability('custom', newCapability)
                        setNewCapability('')
                      }}
                      disabled={!newCapability.trim()}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {Object.values(capabilities).flatMap(c => c).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-6">
                    {Object.values(capabilities).flatMap(c => c).map((capability) => (
                      <Badge key={capability} variant="outline" className="text-xs group relative pr-6 whitespace-normal">
                        {capability}
                        <button
                          onClick={() => handleRemoveCapability(capability)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Action buttons */}
        {
          (libraryEntry.title.trim() || libraryEntry.description.trim() || selectedAgentIds.size > 0)
          && (
            <div className="sticky bottom-4 flex justify-between items-center px-4 py-3 mx-3 rounded-lg bg-background shadow-md border animate-in slide-in-from-bottom duration-300 fade-in">
              <h2 className="text-base font-medium">
                {isPublishing ? "Publishing your agent collection..." :
                  !isFormValid ? (
                    `Missing field: ${[
                      !libraryEntry.title.trim() ? "Title" : "",
                      !libraryEntry.description.trim() ? "Description" : "",
                      selectedAgentIds.size === 0 ? "Agent Selection" : "",
                    ].filter(t => t).join(", ")}`
                  ) : "Ready to publish to library!"}
              </h2>
              <div className="flex items-center gap-3">
                {(libraryEntry.title.trim() || libraryEntry.description.trim() || selectedAgentIds.size > 0) && (
                  <Button
                    variant='ghost'
                    className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                    onClick={() => {
                      setSelectedAgentIds(new Set())
                      setLibraryEntry({
                        title: '',
                        description: '',
                        agents: []
                      })
                      setCapabilities({})
                      setNewCapability('')
                      setHasChanges(false) // Clear unsaved changes flag
                    }}
                  >
                    Reset
                  </Button>
                )}
                <Button
                  variant='default'
                  onClick={handlePublish}
                  disabled={!isFormValid || isPublishing}
                  className="flex items-center"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Publish to Library
                    </>
                  )}
                </Button>
              </div>
            </div>
          )
        }

        {/* Navigation Confirmation Dialog */}
        <Dialog open={showNavigationDialog} onOpenChange={setShowNavigationDialog}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>Unsaved Changes</DialogTitle>
              <DialogDescription>
                You have unsaved changes. Are you sure you want to leave this page?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowNavigationDialog(false)
                  handleNavigationCancel()
                }}
                className="w-full sm:w-auto"
              >
                Stay on Page
              </Button>
              <Button
                onClick={() => {
                  setShowNavigationDialog(false)
                  handleNavigationConfirm()
                }}
                className="w-full sm:w-auto"
              >
                Leave Page
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}