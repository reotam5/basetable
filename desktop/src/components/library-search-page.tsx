import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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

  const handleAgentClick = (agent: NonNullable<typeof agents>[number]) => {
    setSelectedAgent(agent);
    setIsDialogOpen(true);
    setInstallError(null); // Clear any previous errors
  };

  const handleInstall = async (agent: NonNullable<typeof agents>[number]) => {
    setIsInstalling(true);
    setInstallError(null);

    try {
      // Install MCP servers if any
      const installedMcpServers: { [serverId: number]: string[] } = {};

      if (agent.mcp && agent.mcp.length > 0) {
        for (const mcpTool of agent.mcp) {
          try {
            const mcpServer = await window.electronAPI.mcp.createNewMcp({
              server_config: {
                command: mcpTool.command,
                args: mcpTool.arguments || [],
                env: mcpTool.env || {},
              },
            });

            if (mcpServer) {
              // Get available tools for this server and add them all
              const allServers = await window.electronAPI.mcp.getAll();
              const server = allServers.find((s) => s.id === mcpServer.id);
              if (server?.available_tools) {
                installedMcpServers[mcpServer.id] = server.available_tools.map(
                  (tool) => tool.id,
                );
              }
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
      if (agent.comm_preferences?.tone?.id) {
        styles.push(agent.comm_preferences.tone.id);
      }
      if (agent.comm_preferences?.style?.id) {
        styles.push(agent.comm_preferences.style.id);
      }

      // Create the agent
      await window.electronAPI.agent.create({
        name: agent.name,
        instruction: agent.system_prompt || "",
        llmId: agent.model.id,
        mcpTools: installedMcpServers,
        styles: styles.length > 0 ? styles : undefined,
      });

      // Show success toast
      toast("Agent installed", {
        icon: <Download className="h-4 w-4" />,
        description: `Successfully installed "${agent.name}" agent.`,
      });

      setIsDialogOpen(false);
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
                                <div className="mt-1 p-2 bg-muted/50 rounded text-xs font-mono">
                                  {tool.arguments.join(" ")}
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
                                        : {value}
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
    </div>
  );
}
