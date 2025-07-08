import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { use } from "@/hooks/use"
import { Check, ChevronDown, ChevronUp, Loader2, Search, Share } from "lucide-react"
import { useCallback, useState } from "react"
import { toast } from "sonner"

export function LibraryPublishPage() {
  const { data: agents, isLoading, refetch } = use({
    fetcher: useCallback(async () => (await window.electronAPI.agent.getAllAgentsWithTools())?.filter(a => a.uploaded_status !== 'downloaded'), [])
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [isInstructionExpanded, setIsInstructionExpanded] = useState(false)
  const [expandedMcpIndex, setExpandedMcpIndex] = useState<number | null>(null)
  const [placeholderConfigs, setPlaceholderConfigs] = useState<{
    [mcpIndex: number]: {
      args: Set<number>,
      env: Set<string>,
      argDescriptions: { [argIndex: number]: string },
      envDescriptions: { [envKey: string]: string }
    }
  }>({})

  const handleAgentSelect = (agentId: number) => {
    setSelectedAgent(agentId)
    setShowShareDialog(true)
    setIsInstructionExpanded(false)
    setExpandedMcpIndex(null)
    // Initialize placeholder configs for this agent's MCP servers
    const selectedAgentData = availableAgents.find(a => a.id === agentId)
    if (selectedAgentData?.mcps && selectedAgentData.mcps.length > 0) {
      const initialConfigs: {
        [mcpIndex: number]: {
          args: Set<number>,
          env: Set<string>,
          argDescriptions: { [argIndex: number]: string },
          envDescriptions: { [envKey: string]: string }
        }
      } = {}
      selectedAgentData.mcps.forEach((_, index) => {
        initialConfigs[index] = {
          args: new Set(),
          env: new Set(),
          argDescriptions: {},
          envDescriptions: {}
        }
      })
      setPlaceholderConfigs(initialConfigs)
    }
  }

  const handleCloseDialog = () => {
    setShowShareDialog(false)
    setSelectedAgent(null)
    setIsInstructionExpanded(false)
    setExpandedMcpIndex(null)
    setPlaceholderConfigs({})
  }

  const toggleArgPlaceholder = (mcpIndex: number, argIndex: number) => {
    setPlaceholderConfigs(prev => {
      const newConfigs = { ...prev }
      if (!newConfigs[mcpIndex]) {
        newConfigs[mcpIndex] = {
          args: new Set(),
          env: new Set(),
          argDescriptions: {},
          envDescriptions: {}
        }
      }

      const newArgs = new Set(newConfigs[mcpIndex].args)
      if (newArgs.has(argIndex)) {
        newArgs.delete(argIndex)
        // Remove description when unchecking
        const newArgDescriptions = { ...newConfigs[mcpIndex].argDescriptions }
        delete newArgDescriptions[argIndex]
        newConfigs[mcpIndex] = {
          ...newConfigs[mcpIndex],
          args: newArgs,
          argDescriptions: newArgDescriptions
        }
      } else {
        newArgs.add(argIndex)
        newConfigs[mcpIndex] = { ...newConfigs[mcpIndex], args: newArgs }
      }

      return newConfigs
    })
  }

  const toggleEnvPlaceholder = (mcpIndex: number, envKey: string) => {
    setPlaceholderConfigs(prev => {
      const newConfigs = { ...prev }
      if (!newConfigs[mcpIndex]) {
        newConfigs[mcpIndex] = {
          args: new Set(),
          env: new Set(),
          argDescriptions: {},
          envDescriptions: {}
        }
      }

      const newEnv = new Set(newConfigs[mcpIndex].env)
      if (newEnv.has(envKey)) {
        newEnv.delete(envKey)
        // Remove description when unchecking
        const newEnvDescriptions = { ...newConfigs[mcpIndex].envDescriptions }
        delete newEnvDescriptions[envKey]
        newConfigs[mcpIndex] = {
          ...newConfigs[mcpIndex],
          env: newEnv,
          envDescriptions: newEnvDescriptions
        }
      } else {
        newEnv.add(envKey)
        newConfigs[mcpIndex] = { ...newConfigs[mcpIndex], env: newEnv }
      }

      return newConfigs
    })
  }

  const updateArgDescription = (mcpIndex: number, argIndex: number, description: string) => {
    setPlaceholderConfigs(prev => {
      const newConfigs = { ...prev }
      if (!newConfigs[mcpIndex]) return prev

      newConfigs[mcpIndex] = {
        ...newConfigs[mcpIndex],
        argDescriptions: {
          ...newConfigs[mcpIndex].argDescriptions,
          [argIndex]: description
        }
      }
      return newConfigs
    })
  }

  const updateEnvDescription = (mcpIndex: number, envKey: string, description: string) => {
    setPlaceholderConfigs(prev => {
      const newConfigs = { ...prev }
      if (!newConfigs[mcpIndex]) return prev

      newConfigs[mcpIndex] = {
        ...newConfigs[mcpIndex],
        envDescriptions: {
          ...newConfigs[mcpIndex].envDescriptions,
          [envKey]: description
        }
      }
      return newConfigs
    })
  }

  const createPlaceholderConfig = (agentData: any) => {
    if (!agentData.mcps || agentData.mcps.length === 0) return agentData

    // Create a copy with placeholders applied
    const agentWithPlaceholders = { ...agentData }
    agentWithPlaceholders.mcps = agentData.mcps.map((mcp: any, mcpIndex: number) => {
      const placeholderConfig = placeholderConfigs[mcpIndex]
      if (!placeholderConfig) return mcp

      const mcpCopy = { ...mcp }

      // Apply placeholders to args
      if (mcp.serverConfig?.args && placeholderConfig.args.size > 0) {
        mcpCopy.serverConfig = { ...mcp.serverConfig }
        mcpCopy.serverConfig.args = mcp.serverConfig.args.map((arg: string, argIndex: number) => {
          if (placeholderConfig.args.has(argIndex)) {
            const description = placeholderConfig.argDescriptions[argIndex] || ""
            return `{{PLACEHOLDER_ARG_${mcpIndex}_${argIndex}:${description}}}`
          }
          return arg
        })
      }

      // Apply placeholders to env
      if (mcp.serverConfig?.env && placeholderConfig.env.size > 0) {
        mcpCopy.serverConfig = { ...mcpCopy.serverConfig }
        mcpCopy.serverConfig.env = { ...mcp.serverConfig.env }
        for (const envKey of placeholderConfig.env) {
          if (mcp.serverConfig.env[envKey] !== undefined) {
            const description = placeholderConfig.envDescriptions[envKey] || ""
            mcpCopy.serverConfig.env[envKey] = `{{PLACEHOLDER_ENV_${mcpIndex}_${envKey}:${description}}}`
          }
        }
      }

      return mcpCopy
    })

    return agentWithPlaceholders
  }

  const handleShare = async () => {
    const selectedAgentData = availableAgents.find(a => a.id === selectedAgent)
    if (!selectedAgent || !selectedAgentData) return

    setIsSharing(true)
    try {
      // Create agent config with placeholders
      const agentWithPlaceholders = createPlaceholderConfig(selectedAgentData)

      // Simulate API call to share to library
      await window.electronAPI.library.create(agentWithPlaceholders)

      toast.success("Agent shared successfully!", {
        description: `${selectedAgentData?.name} is now available in the community library.`,
      })

      // Mark agent as shared and close dialog
      await refetch()
      setSelectedAgent(null)
      setShowShareDialog(false)

    } catch {
      toast.error("Failed to share agent")
    } finally {
      setIsSharing(false)
    }
  }

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

  const availableAgents = agents?.filter(agent => !agent.is_main) || []
  const filteredAgents = availableAgents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const selectedAgentData = selectedAgent ? availableAgents.find(a => a.id === selectedAgent) : null

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      <div className="flex-1 space-y-8 p-6 mx-auto max-w-5xl w-full">
        {/* Header */}
        <div className="pb-2">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Share Your Agents
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Choose an agent to share with the community.
          </p>
        </div>

        {availableAgents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CardTitle className="text-lg font-medium mb-2">No agents available</CardTitle>
              <CardDescription>Create some agents first to share them with the community</CardDescription>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Agent Table */}
            {filteredAgents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No agents found matching "{searchTerm}"</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent Name</TableHead>
                    <TableHead>Instruction</TableHead>
                    <TableHead>Tools</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgents.map((agent) => {
                    const isShared = agent.uploaded_status === 'uploaded'

                    return (
                      <TableRow
                        key={agent.id}
                        className={`cursor-pointer`}
                        onClick={() => handleAgentSelect(agent.id)}
                      >
                        <TableCell className="font-medium">{agent.name}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate text-sm text-muted-foreground" title={agent.instruction}>
                            {agent.instruction}
                          </div>
                        </TableCell>
                        <TableCell>
                          {agent.mcps?.length > 0 ? `${agent.mcps.length} tool${agent.mcps.length > 1 ? 's' : ''}` : 'None'}
                        </TableCell>
                        <TableCell className="text-right">
                          {isShared ? (
                            <div className="flex items-center justify-end gap-1 text-green-600 text-sm font-medium">
                              <Check className="h-4 w-4" />
                              Shared
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" onClick={(e) => {
                              e.stopPropagation()
                              handleAgentSelect(agent.id)
                            }}>
                              <Share className="h-4 w-4 mr-2" />
                              Share
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </>
        )}

        {/* Share Confirmation Dialog */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>
                Share "{selectedAgentData?.name}"
              </DialogTitle>
              <DialogDescription>
                This will make your agent available for others to download and use from the online library.
              </DialogDescription>
            </DialogHeader>

            {selectedAgentData && (
              <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                {/* Agent Details */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Agent Name</span>
                    <span className="text-sm font-medium">{selectedAgentData.name}</span>
                  </div>
                  {selectedAgentData.tones?.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tone</span>
                      <span className="text-sm font-medium">{selectedAgentData.tones?.[0]?.name}</span>
                    </div>
                  )}
                  {selectedAgentData.styles?.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Style</span>
                      <span className="text-sm font-medium">{selectedAgentData.styles?.[0]?.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Instruction</span>
                    <div className="text-sm font-medium max-w-xs text-right truncate whitespace-normal break-words">
                      {selectedAgentData.instruction.length > 100 ? (
                        <div className="space-y-2">
                          <div>
                            {isInstructionExpanded
                              ? selectedAgentData.instruction
                              : `${selectedAgentData.instruction.slice(0, 100)}...`
                            }
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsInstructionExpanded(!isInstructionExpanded)}
                            className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            {isInstructionExpanded ? (
                              <>
                                Show less <ChevronUp className="h-3 w-3 ml-1" />
                              </>
                            ) : (
                              <>
                                Show more <ChevronDown className="h-3 w-3 ml-1" />
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        selectedAgentData.instruction
                      )}
                    </div>
                  </div>
                  {selectedAgentData.mcps && selectedAgentData.mcps.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground block mb-2">Available Tools</span>
                      <div className="">
                        {selectedAgentData.mcps.map((mcp, index) => (
                          <div key={index}>
                            <div className="flex items-center justify-between py-2">
                              <span className="text-sm font-medium">{mcp.name}</span>
                              {mcp.serverConfig && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExpandedMcpIndex(expandedMcpIndex === index ? null : index)}
                                  className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                                >
                                  {expandedMcpIndex === index ? (
                                    <>
                                      Hide details <ChevronUp className="h-3 w-3 ml-1" />
                                    </>
                                  ) : (
                                    <>
                                      Show details <ChevronDown className="h-3 w-3 ml-1" />
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                            {mcp.serverConfig && expandedMcpIndex === index && (
                              <div className="ml-4 pb-2 space-y-3 border-l-2 border-muted pl-4">
                                <div className="text-xs">
                                  <span className="font-medium text-muted-foreground">Command:</span>
                                  <div className="mt-1 p-2 bg-muted/50 rounded text-xs font-mono">
                                    {mcp.serverConfig.command}
                                  </div>
                                </div>
                                {mcp.serverConfig.args && mcp.serverConfig.args.length > 0 && (
                                  <div className="text-xs">
                                    <span className="font-medium text-muted-foreground">Arguments:</span>
                                    <div className="mt-1 space-y-1">
                                      {mcp.serverConfig.args.map((arg: string, argIndex: number) => (
                                        <div key={argIndex} className="space-y-2">
                                          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                            <code className="text-xs flex-1">{arg}</code>
                                            <label className="flex items-center gap-1 cursor-pointer ml-2">
                                              <input
                                                type="checkbox"
                                                checked={placeholderConfigs[index]?.args?.has(argIndex) || false}
                                                onChange={() => toggleArgPlaceholder(index, argIndex)}
                                                className="rounded text-xs"
                                              />
                                              <span className="text-xs text-muted-foreground">Placeholder</span>
                                            </label>
                                          </div>
                                          {placeholderConfigs[index]?.args?.has(argIndex) && (
                                            <div className="ml-4 p-2 bg-blue-50 border border-blue-200 rounded">
                                              <label className="text-xs font-medium text-blue-800 block mb-1">
                                                Description for users:
                                              </label>
                                              <Input
                                                value={placeholderConfigs[index]?.argDescriptions?.[argIndex] || ""}
                                                onChange={(e) => updateArgDescription(index, argIndex, e.target.value)}
                                                placeholder="e.g., Path to your documents folder"
                                                className="text-xs h-7"
                                              />
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {mcp.serverConfig.env && Object.keys(mcp.serverConfig.env).length > 0 && (
                                  <div className="text-xs">
                                    <span className="font-medium text-muted-foreground">Environment Variables:</span>
                                    <div className="mt-1 space-y-1">
                                      {Object.entries(mcp.serverConfig.env).map(([key, value]) => (
                                        <div key={key} className="space-y-2">
                                          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                            <code className="text-xs flex-1">
                                              <span className="text-blue-600">{key}</span>: <span>{value}</span>
                                            </code>
                                            <label className="flex items-center gap-1 cursor-pointer ml-2">
                                              <input
                                                type="checkbox"
                                                checked={placeholderConfigs[index]?.env?.has(key) || false}
                                                onChange={() => toggleEnvPlaceholder(index, key)}
                                                className="rounded text-xs"
                                              />
                                              <span className="text-xs text-muted-foreground">Placeholder</span>
                                            </label>
                                          </div>
                                          {placeholderConfigs[index]?.env?.has(key) && (
                                            <div className="ml-4 p-2 bg-blue-50 border border-blue-200 rounded">
                                              <label className="text-xs font-medium text-blue-800 block mb-1">
                                                Description for users:
                                              </label>
                                              <Input
                                                value={placeholderConfigs[index]?.envDescriptions?.[key] || ""}
                                                onChange={(e) => updateEnvDescription(index, key, e.target.value)}
                                                placeholder="e.g., Your API key from the service"
                                                className="text-xs h-7"
                                              />
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter className="flex-shrink-0 mt-4">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              {
                selectedAgentData?.uploaded_status !== 'uploaded' && (
                  <Button
                    onClick={handleShare}
                    disabled={isSharing}
                  >
                    {isSharing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sharing...
                      </>
                    ) : (
                      <>
                        Share
                      </>
                    )}
                  </Button>
                )
              }
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}