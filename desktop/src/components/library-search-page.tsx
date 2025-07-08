import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { use } from "@/hooks/use";
import { Bot, Download, Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function LibrarySearchPage() {
  const { data: agents } = use({ fetcher: window.electronAPI.library.getAll });
  const [searchQuery, setSearchQuery] = useState(() => {
    // Initialize from localStorage or URL params
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return (
        urlParams.get("q") || localStorage.getItem("library-search-query") || ""
      );
    }
    return "";
  });

  const [selectedAgent, setSelectedAgent] = useState<
    NonNullable<typeof agents>[number] | null
  >(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const [showPlaceholderDialog, setShowPlaceholderDialog] = useState(false);
  const [placeholderValues, setPlaceholderValues] = useState<{ [key: string]: string }>({});
  const [agentWithPlaceholders, setAgentWithPlaceholders] = useState<NonNullable<typeof agents>[number] | null>(null);

  const detectPlaceholders = (agent: NonNullable<typeof agents>[number]) => {
    const placeholders: { key: string, description: string, type: 'arg' | 'env', mcpName: string }[] = []

    if (agent.mcp && agent.mcp.length > 0) {
      agent.mcp.forEach((mcpTool, mcpIndex) => {
        // Check arguments for placeholders
        if (mcpTool.arguments) {
          mcpTool.arguments.forEach((arg, argIndex) => {
            const match = arg.match(/\{\{PLACEHOLDER_ARG_(\d+)_(\d+):?(.*?)\}\}/)
            if (match) {
              const description = match[3] || `Argument ${argIndex + 1}`
              placeholders.push({
                key: `ARG_${mcpIndex}_${argIndex}`,
                description: description,
                type: 'arg',
                mcpName: mcpTool.command
              })
            }
          })
        }

        // Check environment variables for placeholders
        if (mcpTool.env) {
          Object.entries(mcpTool.env).forEach(([envKey, envValue]) => {
            const match = String(envValue).match(/\{\{PLACEHOLDER_ENV_(\d+)_(.+?):?(.*?)\}\}/)
            if (match) {
              const description = match[3] || envKey
              placeholders.push({
                key: `ENV_${mcpIndex}_${envKey}`,
                description: description,
                type: 'env',
                mcpName: mcpTool.command
              })
            }
          })
        }
      })
    }

    return placeholders
  }

  const resolvePlaceholders = (agent: NonNullable<typeof agents>[number], values: { [key: string]: string }) => {
    const resolvedAgent = JSON.parse(JSON.stringify(agent)) // Deep clone

    if (resolvedAgent.mcp && resolvedAgent.mcp.length > 0) {
      resolvedAgent.mcp.forEach((mcpTool: any, mcpIndex: number) => {
        // Resolve argument placeholders
        if (mcpTool.arguments) {
          mcpTool.arguments = mcpTool.arguments.map((arg: string, argIndex: number) => {
            const match = arg.match(/\{\{PLACEHOLDER_ARG_(\d+)_(\d+):?(.*?)\}\}/)
            if (match) {
              const key = `ARG_${mcpIndex}_${argIndex}`
              return values[key] || "" // Use provided value or empty string
            }
            return arg
          })
        }

        // Resolve environment variable placeholders
        if (mcpTool.env) {
          Object.keys(mcpTool.env).forEach(envKey => {
            const envValue = mcpTool.env[envKey]
            const match = String(envValue).match(/\{\{PLACEHOLDER_ENV_(\d+)_(.+?):?(.*?)\}\}/)
            if (match) {
              const key = `ENV_${mcpIndex}_${envKey}`
              mcpTool.env[envKey] = values[key] || "" // Use provided value or empty string
            }
          })
        }
      })
    }

    return resolvedAgent
  }

  const formatDisplayValue = (value: string) => {
    // Replace placeholder patterns with user-friendly text
    const argMatch = value.match(/\{\{PLACEHOLDER_ARG_\d+_\d+:?(.*?)\}\}/)
    if (argMatch) {
      const description = argMatch[1] || "value"
      return `[Placeholder - ${description}]`
    }
    const envMatch = value.match(/\{\{PLACEHOLDER_ENV_\d+_.+?:?(.*?)\}\}/)
    if (envMatch) {
      const description = envMatch[1] || "value"
      return `[Placeholder - ${description}]`
    }
    return value
  }

  const handleAgentClick = (agent: NonNullable<typeof agents>[number]) => {
    setSelectedAgent(agent);
    setIsDialogOpen(true);
    setInstallError(null); // Clear any previous errors

    // Check if agent has placeholders
    const placeholders = detectPlaceholders(agent)
    if (placeholders.length > 0) {
      setAgentWithPlaceholders(agent)
      // Initialize placeholder values as empty
      const initialValues: { [key: string]: string } = {}
      placeholders.forEach(placeholder => {
        initialValues[placeholder.key] = ""
      })
      setPlaceholderValues(initialValues)
    } else {
      setAgentWithPlaceholders(null)
      setPlaceholderValues({})
    }
  };

  const handleInstall = async (agent: NonNullable<typeof agents>[number]) => {
    // Check if agent has placeholders and show configuration dialog first
    const placeholders = detectPlaceholders(agent)
    if (placeholders.length > 0) {
      setAgentWithPlaceholders(agent)
      setShowPlaceholderDialog(true)
      return
    }

    // Proceed with installation
    await performInstallation(agent)
  }

  const performInstallation = async (agent: NonNullable<typeof agents>[number]) => {
    setIsInstalling(true);
    setInstallError(null);

    try {
      // Resolve placeholders if any
      const resolvedAgent = agentWithPlaceholders && Object.keys(placeholderValues).length > 0
        ? resolvePlaceholders(agent, placeholderValues)
        : agent

      // Install MCP servers if any
      const installedMcpServers: { [serverId: number]: string[] } = {};

      if (resolvedAgent.mcp && resolvedAgent.mcp.length > 0) {
        for (const mcpTool of resolvedAgent.mcp) {
          try {
            const mcpServer = await window.electronAPI.mcp.createNewMcp({
              server_config: {
                command: mcpTool.command,
                args: mcpTool.arguments || [],
                env: mcpTool.env || {},
              },
            });

            if (mcpServer) {
              installedMcpServers[mcpServer.id] = mcpTool.selected_tools
            }
          } catch (mcpError) {
            console.error(`Failed to install MCP server:`, mcpError);
            throw new Error(
              `Failed to install MCP server: ${mcpError instanceof Error ? mcpError.message : "Unknown error"}`,
            );
          }
        }
      }

      // Get style IDs if available
      const styles: number[] = [];
      if (resolvedAgent.comm_preferences?.tone?.id) {
        styles.push(resolvedAgent.comm_preferences.tone.id);
      }
      if (resolvedAgent.comm_preferences?.style?.id) {
        styles.push(resolvedAgent.comm_preferences.style.id);
      }

      // Create the agent
      await window.electronAPI.agent.create({
        name: resolvedAgent.name,
        instruction: resolvedAgent.system_prompt || "",
        llmId: resolvedAgent.model.id,
        mcpTools: installedMcpServers,
        styles: styles.length > 0 ? styles : undefined,
        uploaded_status: 'downloaded'
      });

      // Show success toast
      toast("Agent installed", {
        icon: <Download className="h-4 w-4" />,
        description: `Successfully installed "${resolvedAgent.name}" agent.`,
      });

      setIsDialogOpen(false);
      setShowPlaceholderDialog(false);
      setAgentWithPlaceholders(null);
      setPlaceholderValues({});
      // You might want to show a success message or redirect here
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setInstallError(errorMessage);

      // Show error toast
      toast("Installation failed", {
        icon: <Bot className="h-4 w-4" />,
        description: errorMessage,
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const handlePlaceholderInstall = async () => {
    if (!agentWithPlaceholders) return
    await performInstallation(agentWithPlaceholders)
  }

  // Update localStorage and URL when search query changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (searchQuery) {
        localStorage.setItem("library-search-query", searchQuery);
        const url = new URL(window.location.href);
        url.searchParams.set("q", searchQuery);
        window.history.replaceState({}, "", url.toString());
      } else {
        localStorage.removeItem("library-search-query");
        const url = new URL(window.location.href);
        url.searchParams.delete("q");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [searchQuery]);

  // Filter agents based on search query
  const filteredAgents =
    agents?.filter((agent) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        agent.name.toLowerCase().includes(searchLower) ||
        agent.system_prompt?.toLowerCase().includes(searchLower) ||
        agent.comm_preferences?.tone?.name
          ?.toLowerCase()
          .includes(searchLower) ||
        agent.comm_preferences?.style?.name
          ?.toLowerCase()
          .includes(searchLower);

      return matchesSearch;
    }) ?? [];

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      <div className="flex-1 space-y-6 p-6 mx-auto max-w-5xl w-full">
        {/* Header */}
        <div className="border-b pb-6">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Search className="h-8 w-8" />
            Discover Agents
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Find and install agents shared by the community to enhance your
            workflow.
          </p>
        </div>

        {/* Search */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search agents..."
              className="pl-10 w-full"
            />
          </div>

          {/* Results Count */}
          <p className="text-sm text-muted-foreground">
            {filteredAgents.length} agent
            {filteredAgents.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Agent Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAgents.map((agent) => (
            <Card
              key={agent.id}
              className="hover:shadow-md transition-shadow flex flex-col cursor-pointer gap-0"
              onClick={() => handleAgentClick(agent)}
            >
              <CardHeader className="pb-3 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {agent.model?.display_name || "Unknown Model"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex-1">
                <div className="space-y-3">
                  {/* System Prompt Preview */}
                  {agent.system_prompt && (
                    <div className="h-[60px]">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {agent.system_prompt}
                      </p>
                    </div>
                  )}

                  {/* Communication Preferences */}
                  {(agent.comm_preferences?.tone ||
                    agent.comm_preferences?.style) && (
                      <div className="flex gap-2 flex-wrap">
                        {agent.comm_preferences.tone && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {agent.comm_preferences.tone?.name}
                          </Badge>
                        )}
                        {agent.comm_preferences.style && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {agent.comm_preferences.style?.name}
                          </Badge>
                        )}
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredAgents.length === 0 && (
          <div className="text-center py-12">
            <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No agents found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search query to find more agents.
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Agent Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedAgent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Bot className="h-6 w-6 text-primary" />
                  </div>
                  {selectedAgent.name}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Error Display */}
                {installError && (
                  <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-red-800">
                          Installation Failed
                        </h3>
                        <p className="text-sm text-red-700 mt-1">
                          {installError}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInstallError(null)}
                        className="h-auto p-1 text-red-600 hover:text-red-800"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                )}

                {/* Agent Details */}
                <div className="space-y-4">
                  {/* Model and Tools Info */}
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">
                      {selectedAgent.model?.display_name || "Unknown Model"}
                    </Badge>
                  </div>

                  {/* Communication Preferences */}
                  {(selectedAgent.comm_preferences?.tone ||
                    selectedAgent.comm_preferences?.style) && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">
                          Communication Style
                        </h4>
                        <div className="flex gap-2 flex-wrap">
                          {selectedAgent.comm_preferences.tone && (
                            <Badge variant="outline" className="capitalize">
                              Tone: {selectedAgent.comm_preferences.tone?.name}
                            </Badge>
                          )}
                          {selectedAgent.comm_preferences.style && (
                            <Badge variant="outline" className="capitalize">
                              Style: {selectedAgent.comm_preferences.style?.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                  {/* System Prompt */}
                  {selectedAgent.system_prompt && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        System Prompt
                      </h4>
                      <div className="bg-muted/50 rounded-lg p-3 text-sm">
                        {selectedAgent.system_prompt}
                      </div>
                    </div>
                  )}

                  {/* Available Tools */}
                  {selectedAgent.mcp && selectedAgent.mcp.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        Available Tools
                      </h4>
                      <div className="space-y-3">
                        {selectedAgent.mcp.map((tool, index) => (
                          <div
                            key={index}
                            className="border rounded-lg p-3 space-y-2"
                          >
                            <div>
                              <span className="text-xs text-muted-foreground">
                                Command:
                              </span>
                              <div className="mt-1 p-2 bg-muted/50 rounded text-xs font-mono">
                                {tool.command}
                              </div>
                            </div>
                            {tool.arguments && tool.arguments.length > 0 && (
                              <div>
                                <span className="text-xs text-muted-foreground">
                                  Arguments:
                                </span>
                                <div className="mt-1 space-y-1">
                                  {tool.arguments.map((arg, argIndex) => (
                                    <div key={argIndex} className="p-2 bg-muted/50 rounded text-xs font-mono">
                                      {formatDisplayValue(arg)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {tool.env && Object.keys(tool.env).length > 0 && (
                              <div>
                                <span className="text-xs text-muted-foreground">
                                  Environment Variables:
                                </span>
                                <div className="mt-1 space-y-1">
                                  {Object.entries(tool.env).map(
                                    ([key, value]) => (
                                      <div
                                        key={key}
                                        className="p-2 bg-muted/50 rounded text-xs font-mono"
                                      >
                                        <span className="text-blue-600">
                                          {key}
                                        </span>
                                        : {formatDisplayValue(String(value))}
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Install Button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    size="lg"
                    onClick={() => handleInstall(selectedAgent)}
                    disabled={isInstalling}
                  >
                    {isInstalling ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Installing...
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5 mr-2" />
                        Install Agent
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Placeholder Configuration Dialog */}
      <Dialog open={showPlaceholderDialog} onOpenChange={setShowPlaceholderDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Installation</DialogTitle>
            <DialogDescription>
              This agent requires some configuration values. Please review and customize the values below.
            </DialogDescription>
          </DialogHeader>

          {agentWithPlaceholders && (
            <div className="space-y-6">
              {detectPlaceholders(agentWithPlaceholders).map((placeholder) => (
                <div key={placeholder.key} className="space-y-2">
                  <label className="text-sm font-medium">
                    <span className="text-muted-foreground">{placeholder.mcpName}</span> - {placeholder.description}
                    {placeholder.type === 'env' && <span className="text-xs text-muted-foreground ml-1">(Environment Variable)</span>}
                    {placeholder.type === 'arg' && <span className="text-xs text-muted-foreground ml-1">(Command Argument)</span>}
                  </label>
                  <Input
                    value={placeholderValues[placeholder.key] || ""}
                    onChange={(e) => setPlaceholderValues(prev => ({
                      ...prev,
                      [placeholder.key]: e.target.value
                    }))}
                    placeholder={placeholder.description ? `Enter ${placeholder.description.toLowerCase()}...` : `Enter value...`}
                    className="font-mono text-sm"
                  />
                  {placeholder.description && placeholder.description !== `Argument ${placeholder.key.split('_')[2]}` && placeholder.description !== placeholder.key.split('_')[2] && (
                    <p className="text-xs text-muted-foreground">
                      {placeholder.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowPlaceholderDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePlaceholderInstall}
              disabled={isInstalling}
            >
              {isInstalling ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Installing...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Install Agent
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
