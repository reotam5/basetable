import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Check, ChevronDown, ChevronRight } from "lucide-react"
import { useState } from "react"

interface MCPServer {
  id: number
  name: string
  description: string
  tools: string[]
  icon: string
  is_active?: boolean
  is_installed?: boolean
}

interface MCPToolSelectorProps {
  servers: MCPServer[]
  selectedTools: { [serverId: number]: string[] }
  onToolSelectionChange: (serverId: number, selectedTools: string[]) => void
}

export function MCPToolSelector({ servers, selectedTools, onToolSelectionChange }: MCPToolSelectorProps) {
  const [expandedServers, setExpandedServers] = useState<Set<number>>(new Set())

  const toggleServerExpansion = (serverId: number) => {
    setExpandedServers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(serverId)) {
        newSet.delete(serverId)
      } else {
        newSet.add(serverId)
      }
      return newSet
    })
  }

  const toggleServerSelection = (serverId: number) => {
    const serverTools = servers.find(s => s.id === serverId)?.tools || []
    const currentSelection = selectedTools[serverId] || []

    if (currentSelection.length === serverTools.length) {
      // If all tools are selected, deselect all
      onToolSelectionChange(serverId, [])
    } else {
      // If not all tools are selected, select all
      onToolSelectionChange(serverId, serverTools)
    }
  }

  const toggleToolSelection = (serverId: number, tool: string) => {
    const currentSelection = selectedTools[serverId] || []
    const newSelection = currentSelection.includes(tool)
      ? currentSelection.filter(t => t !== tool)
      : [...currentSelection, tool]

    onToolSelectionChange(serverId, newSelection)
  }

  const getServerSelectionState = (serverId: number) => {
    const serverTools = servers.find(s => s.id === serverId)?.tools || []
    const currentSelection = selectedTools[serverId] || []

    if (currentSelection.length === 0) return 'none'
    if (currentSelection.length === serverTools.length) return 'all'
    return 'partial'
  }

  if (!servers || servers.length === 0) {
    return (
      <div className="border border-border rounded-lg p-6 text-center bg-background">
        <p className="text-sm text-muted-foreground">No MCP servers available</p>
        <p className="text-xs text-muted-foreground mt-1">Install and activate MCP servers to extend your agent's capabilities</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {servers.map((server) => {
        const selectionState = getServerSelectionState(server.id)
        const isExpanded = expandedServers.has(server.id)
        const selectedCount = (selectedTools[server.id] || []).length

        return (
          <div key={server.id} className="border border-border rounded-lg bg-background">
            <div className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2 flex-1 min-w-0">
                  <img
                    src={server.icon}
                    alt={`${server.name} logo`}
                    className="w-4 h-4 object-contain mt-0.5 shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="font-medium text-sm truncate">{server.name}</div>
                      {selectedCount > 0 && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {selectedCount}/{server.tools.length}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{server.description}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0 ml-2">
                  <button
                    onClick={() => toggleServerSelection(server.id)}
                    className={`p-1 rounded border transition-colors ${selectionState === 'all'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : selectionState === 'partial'
                        ? 'bg-primary/50 text-primary-foreground border-primary'
                        : 'bg-background border-border hover:border-muted-foreground'
                      }`}
                  >
                    {selectionState === 'all' ? (
                      <Check className="w-3 h-3" />
                    ) : selectionState === 'partial' ? (
                      <div className="w-3 h-3 bg-primary-foreground rounded-sm" />
                    ) : (
                      <div className="w-3 h-3" />
                    )}
                  </button>
                  {server.tools.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleServerExpansion(server.id)}
                      className="p-1 h-auto text-muted-foreground hover:text-foreground"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {server.tools.length > 0 && (
              <Collapsible open={isExpanded}>
                <CollapsibleContent>
                  <div className="px-3 pb-3 pt-0">
                    <div className="border-t border-border pt-3">
                      <div className="text-xs font-medium text-muted-foreground mb-2">Available Tools:</div>
                      <div className="space-y-2">
                        {server.tools.map((tool) => {
                          const isSelected = (selectedTools[server.id] || []).includes(tool)
                          return (
                            <div key={tool} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${server.id}-${tool}`}
                                checked={isSelected}
                                onCheckedChange={() => toggleToolSelection(server.id, tool)}
                                className="h-4 w-4"
                              />
                              <label
                                htmlFor={`${server.id}-${tool}`}
                                className="text-xs text-foreground cursor-pointer flex-1"
                              >
                                {tool}
                              </label>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )
      })}
    </div>
  )
}
