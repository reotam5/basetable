import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { use } from "@/hooks/use"
import useAgent from "@/hooks/use-agent"
import { useBlocker, useMatches, useNavigate } from "@tanstack/react-router"
import { Activity, ChevronLeft, ChevronRight, ChevronsUpDown, Save, Search, Settings, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { AnimatedText } from "./animated-text"

interface Template {
  id: string
  name: string
  description: string
  content: string
}


const templates: Template[] = [
  {
    id: 'email-assistant',
    name: 'Email Assistant',
    description: 'AI agent for managing emails',
    content: `You are an email management assistant for {{user_name}}. 

Your primary responsibilities:
- Read and summarize incoming emails
- Draft professional email responses
- Organize emails by priority and category
- Schedule follow-ups for important messages

Available tools: {{mcp_servers}}

Always maintain a professional tone and respect privacy. Ask for confirmation before sending emails on behalf of the user.`
  },
  {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    description: 'AI agent for code review and development',
    content: `You are a senior software engineer and code reviewer for {{user_name}}.

Your responsibilities:
- Review code for best practices, security, and performance
- Suggest improvements and optimizations
- Help debug issues and explain solutions
- Assist with documentation and testing

Available tools: {{mcp_servers}}

Focus on constructive feedback and educational explanations. Always prioritize code quality, security, and maintainability.`
  },
  {
    id: 'research-assistant',
    name: 'Research Assistant',
    description: 'AI agent for research and analysis',
    content: `You are a research assistant helping {{user_name}} with information gathering and analysis.

Your capabilities:
- Conduct thorough research on topics
- Synthesize information from multiple sources
- Create summaries and reports
- Fact-check and verify information

Available tools: {{mcp_servers}}

Always cite sources and provide balanced perspectives. Be transparent about limitations and uncertainties in your research.`
  }
]

const DYNAMIC_VARIABLES = ['{{user_name}}', '{{mcp_servers}}', '{{current_date}}', '{{current_time}}']

// Mock data for agent activities - consistent model since all from same agent
const agentRequests = [
  {
    id: "1",
    timestamp: "2024-05-30 14:28",
    request: "Generate code review for pull request #247",
    model: "Claude 3.5 Sonnet",
    mcpServers: ["GitHub"],
    responseTime: "1.2s",
    cost: "$0.023",
    status: "success",
  },
  {
    id: "2",
    timestamp: "2024-05-30 14:25",
    request: "Summarize latest project documentation",
    model: "Claude 3.5 Sonnet",
    mcpServers: ["File System"],
    responseTime: "0.8s",
    cost: "$0.018",
    status: "success",
  },
  {
    id: "3",
    timestamp: "2024-05-30 14:22",
    request: "Draft email response to client inquiry",
    model: "Claude 3.5 Sonnet",
    mcpServers: ["Gmail"],
    responseTime: "1.1s",
    cost: "$0.015",
    status: "success",
  },
  {
    id: "4",
    timestamp: "2024-05-30 14:18",
    request: "Analyze user feedback from Notion database",
    model: "Claude 3.5 Sonnet",
    mcpServers: ["Notion"],
    responseTime: "2.1s",
    cost: "$0.019",
    status: "success",
  },
  {
    id: "5",
    timestamp: "2024-05-30 14:15",
    request: "Update Slack team with project status",
    model: "Claude 3.5 Sonnet",
    mcpServers: ["Slack"],
    responseTime: "0.9s",
    cost: "$0.018",
    status: "success",
  },
  {
    id: "6",
    timestamp: "2024-05-30 14:12",
    request: "Connect to production database",
    model: "Claude 3.5 Sonnet",
    mcpServers: ["Database"],
    responseTime: "-",
    cost: "-",
    status: "error",
  },
  {
    id: "7",
    timestamp: "2024-05-30 14:05",
    request: "Create meeting notes summary from Notion",
    model: "Claude 3.5 Sonnet",
    mcpServers: ["Notion"],
    responseTime: "1.4s",
    cost: "$0.021",
    status: "success",
  },
  {
    id: "8",
    timestamp: "2024-05-30 13:58",
    request: "Send follow-up email to stakeholders",
    model: "Claude 3.5 Sonnet",
    mcpServers: ["Gmail"],
    responseTime: "0.9s",
    cost: "$0.016",
    status: "success",
  },
  {
    id: "9",
    timestamp: "2024-05-30 13:45",
    request: "Review and merge pull request #245",
    model: "Claude 3.5 Sonnet",
    mcpServers: ["GitHub"],
    responseTime: "2.3s",
    cost: "$0.028",
    status: "success",
  },
  {
    id: "10",
    timestamp: "2024-05-30 13:30",
    request: "Generate test cases for new feature",
    model: "Claude 3.5 Sonnet",
    mcpServers: ["GitHub", "File System"],
    responseTime: "1.8s",
    cost: "$0.024",
    status: "success",
  },
  {
    id: "11",
    timestamp: "2024-05-30 13:15",
    request: "Create Slack channel announcement",
    model: "Claude 3.5 Sonnet",
    mcpServers: ["Slack"],
    responseTime: "0.7s",
    cost: "$0.014",
    status: "success",
  },
  {
    id: "12",
    timestamp: "2024-05-30 13:00",
    request: "Backup critical project files",
    model: "Claude 3.5 Sonnet",
    mcpServers: ["File System"],
    responseTime: "3.2s",
    cost: "$0.012",
    status: "success",
  },
  {
    id: "13",
    timestamp: "2024-05-30 12:30",
    request: "Generate API documentation",
    model: "Claude 3.5 Sonnet",
    mcpServers: ["GitHub", "File System"],
    responseTime: "2.1s",
    cost: "$0.026",
    status: "success",
  },
  {
    id: "14",
    timestamp: "2024-05-30 12:10",
    request: "Schedule team meeting via calendar",
    model: "Claude 3.5 Sonnet",
    mcpServers: ["Gmail"],
    responseTime: "-",
    cost: "-",
    status: "error",
  },
  {
    id: "15",
    timestamp: "2024-05-29 11:30",
    request: "Update project roadmap in Notion",
    model: "Claude 3.5 Sonnet",
    mcpServers: ["Notion"],
    responseTime: "1.6s",
    cost: "$0.022",
    status: "success",
  },
]

export function AgentPage() {
  const matches = useMatches<any>();
  const navigate = useNavigate();
  const currentPath = matches[matches.length - 1]?.fullPath
  const currentRoute = (currentPath?.endsWith('/') && currentPath.length > 1) ? currentPath.slice(0, -1) : currentPath;
  const isMainAgent = currentRoute === '/agent'
  const isNewAgent = currentRoute === '/agents'

  // Memoize fetcher functions to prevent infinite re-renders
  const agentsFetcher = useCallback(() => window.electronAPI.agent.getAll(), []);
  const mcpServersFetcher = useCallback(async () => {
    return (await window.electronAPI.mcp.getAll({ is_active: true }));
  }, []);
  const llmsFetcher = useCallback(async () => {
    return await window.electronAPI.llm.getAll();
  }, []);
  const tonesFetcher = useCallback(async () => await window.electronAPI.agent.getTones(), []);
  const stylesFetcher = useCallback(async () => await window.electronAPI.agent.getStyles(), []);

  const { data } = use({ fetcher: agentsFetcher })
  const mainAgentId = data?.find((agent) => agent.is_main)?.id;
  const agentId = isMainAgent ? mainAgentId : matches?.[matches.length - 1]?.params?.agentId ?? null;
  const { data: mcpServers } = use({ fetcher: mcpServersFetcher });
  const { data: llms } = use({ fetcher: llmsFetcher });
  const { data: tones } = use({ fetcher: tonesFetcher });
  const { data: styles } = use({ fetcher: stylesFetcher });


  const { agent, updateAgent, createAgent, deleteAgent } = useAgent(agentId ?? undefined);
  const [localChanges, setLocalChanges] = useState<any>({});
  const [nameUpdated, setNameUpdated] = useState('');

  useEffect(() => {
    const cleanup = window.electronAPI.agent.onNameUpdate((_id: number, name: string) => setNameUpdated(name));
    return () => cleanup()
  }, [])

  // Create a default agent structure for new agents
  const defaultAgent = {
    id: null,
    name: '',
    instruction: '',
    llmId: null,
    styles: [],
    mcpTools: {}
  };

  const currentAgent = agent ? { ...agent, ...localChanges } : (isNewAgent ? { ...defaultAgent, ...localChanges } : null);
  const selectedTone = tones?.find(t => currentAgent?.styles?.includes(t.id))?.id;
  const selectedStyle = styles?.find(s => currentAgent?.styles?.includes(s.id))?.id;
  const [activeTab, setActiveTab] = useState<string>('configurations')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeServer, setActiveServer] = useState<NonNullable<typeof mcpServers>[number] | null>(null)
  const [serverToolsDialogOpen, setServerToolsDialogOpen] = useState(false)

  // Use a reset key to force remounting of select components
  const [selectResetKey, setSelectResetKey] = useState(0)

  // Track local changes before saving
  const [hasChanges, setHasChanges] = useState(false);

  // Get current agent data with local changes applied

  // Update hasChanges whenever localChanges updates
  useEffect(() => {
    setHasChanges(Object.keys(localChanges).length > 0);
  }, [localChanges]);

  // Block navigation when there are unsaved changes
  const [showNavigationDialog, setShowNavigationDialog] = useState(false);

  const { proceed, reset, status } = useBlocker({
    shouldBlockFn: () => hasChanges,
    withResolver: true
  });

  // Show navigation dialog when navigation is blocked
  useEffect(() => {
    setShowNavigationDialog(status === 'blocked');
  }, [status]);

  // Handle browser window close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const handleNavigationConfirm = () => {
    setHasChanges(false);
    setLocalChanges({});
    proceed?.();
  };

  const handleNavigationCancel = () => {
    reset?.();
  };

  // Helper function to update local changes
  const updateLocalChanges = (changes: any) => {
    setLocalChanges(prev => ({ ...prev, ...changes }));
  };

  // State for LLM model selection
  const [llmSearchQuery, setLlmSearchQuery] = useState('')

  // State for MCP servers browsing
  const [mcpSearchQuery, setMcpSearchQuery] = useState('')

  // State for tools search in modal
  const [toolsSearchQuery, setToolsSearchQuery] = useState('')

  const handleToolSelection = (serverId: number, selectedTools: string[]) => {
    const mcpTools = currentAgent?.mcpTools ? { ...currentAgent.mcpTools } : {}

    if (selectedTools.length > 0) {
      mcpTools[serverId] = selectedTools
    } else {
      delete mcpTools[serverId]
    }

    updateLocalChanges({
      mcpTools: mcpTools
    })
  }

  const selectLLM = (llmId: number) => {
    updateLocalChanges({
      llmId: llmId
    })
  }

  const applyTemplate = (template: Template) => {
    updateLocalChanges({
      instruction: template.content
    })
  }

  const insertVariable = (variable: string) => {
    const textarea = document.querySelector('textarea')
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const currentText = currentAgent?.instruction ?? ''
      const newText = currentText?.substring(0, start) + variable + currentText.substring(end)
      updateLocalChanges({
        instruction: newText
      })
      // Restore cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + variable.length
        textarea.focus()
      }, 0)
    }
  }

  const handleSave = () => {
    if (isNewAgent) {
      // For new agents, we need to apply local changes to the pending updates
      Object.assign(agent || {}, localChanges);
      updateAgent(localChanges);
      createAgent();
      toast("Agent created", {
        icon: <Save className="h-4 w-4" />,
        description: "Successfully created agent.",
      })
    } else {
      updateAgent(localChanges);
      toast("Agent updated", {
        icon: <Save className="h-4 w-4" />,
        description: "Successfully updated agent.",
      })
    }
    // Clear local changes after saving
    setLocalChanges({});
    setHasChanges(false);
  }

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    deleteAgent()
    setShowDeleteDialog(false)

    // Redirect to create agent page
    navigate({ to: "/agent" });
    toast("Agent deleted", {
      icon: <Trash2 className="h-4 w-4" />,
      description: "Successfully deleted agent.",
    })
  }

  const isCreateButtonDisabled = !currentAgent?.instruction || !currentAgent?.llmId

  const renderConfigurationContent = () => (
    <div className="space-y-8">
      {/* Two cards in a row: LLM Model and MCP Servers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LLM Model selection card - redesigned to match MCP Servers card style */}
        <div className="rounded-lg border">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="text-base font-medium">LLM Model</h2>
            <div className="flex items-center gap-2">
              {currentAgent?.llmId ? (
                <Badge variant="outline" className="text-xs">
                  {llms?.find(llm => llm.id === currentAgent.llmId)?.display_name || 'Selected'}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs font-medium">Required</Badge>
              )}
            </div>
          </div>
          <div className="px-3 py-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">Select the model for your agent's responses</p>
            </div>

            {/* Search for LLM models - mirrors MCP server search */}
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search models..."
                className="pl-9 h-8 text-xs"
                value={llmSearchQuery}
                onChange={(e) => {
                  setLlmSearchQuery(e.target.value);
                }}
              />
            </div>

            {llms && llms.length > 0 ? (
              (() => {
                const filteredModels = llms.filter(llm =>
                  llm.display_name.toLowerCase().includes(llmSearchQuery.toLowerCase()) ||
                  (llm.provider && llm.provider.toLowerCase().includes(llmSearchQuery.toLowerCase())) ||
                  (llm.description && llm.description.toLowerCase().includes(llmSearchQuery.toLowerCase()))
                );

                if (filteredModels.length === 0) {
                  return (
                    <div className="h-[268px] flex items-center justify-center">
                      <div className="text-center p-3 rounded-md bg-muted/10">
                        <p className="text-xs text-muted-foreground">No models match your search</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="h-[268px] overflow-y-auto">
                    <div className="space-y-2 pr-2">
                      {filteredModels.map((llm) => (
                        <div
                          key={llm.id}
                          className={`border rounded-md cursor-pointer h-[64px] ${currentAgent?.llmId === llm.id ? 'bg-muted/80 border-primary/30' : 'hover:bg-muted/30'}`}
                          onClick={() => {
                            selectLLM(llm.id);
                            setLlmSearchQuery('');
                          }}
                        >
                          <div className="flex items-center justify-between p-2.5 h-full">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{llm.display_name}</div>
                              {llm.description && (
                                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                  {llm.description}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {llm.provider && (
                                <Badge variant="outline" className="text-xs font-normal">
                                  {llm.provider}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="h-[268px] flex items-center justify-center">
                <div className="text-center p-3 border rounded-md bg-muted/10">
                  <p className="text-xs text-muted-foreground">No LLM models available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MCP Server selection card - using list with pagination */}
        <div className="rounded-lg border">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="text-base font-medium">MCP Servers</h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-medium">Optional</Badge>
            </div>
          </div>
          <div className="px-3 py-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">Select tools and services your agent can access</p>
              <Badge variant="outline" className="text-xs">
                {Object.values(currentAgent?.mcpTools || {})?.filter(v => (v as any[])?.length).length}/{mcpServers?.length ?? 0} servers
              </Badge>
            </div>

            {/* Search for MCP servers */}
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search servers..."
                className="pl-9 h-8 text-xs"
                value={mcpSearchQuery}
                onChange={(e) => {
                  setMcpSearchQuery(e.target.value);
                }}
              />
            </div>

            {mcpServers && mcpServers.length > 0 ? (
              (() => {
                const filteredServers = mcpServers.filter(server =>
                  server?.name?.toLowerCase().includes(mcpSearchQuery.toLowerCase())
                );

                if (filteredServers.length === 0) {
                  return (
                    <div className="h-[268px] flex items-center justify-center">
                      <div className="text-center p-3 rounded-md bg-muted/10">
                        <p className="text-xs text-muted-foreground">No servers match your search</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="h-[268px] overflow-y-auto">
                    <div className="space-y-2 pr-2">
                      {filteredServers.map((server) => {
                        // Guard against servers with null mcp
                        if (!server) return null;

                        const serverId = server.id;
                        const selectedTools = serverId ? (currentAgent?.mcpTools?.[serverId] || []) : [];
                        const serverTools = server.available_tools;
                        const totalTools = serverTools?.length || 0;

                        return (
                          <div
                            key={server?.id}
                            className={`border rounded-md cursor-pointer h-[64px] ${selectedTools.length > 0 ? "bg-muted/80 border-primary/30" : "hover:bg-muted/30"}`}
                            onClick={() => {
                              setActiveServer(server);
                              setServerToolsDialogOpen(true);
                              // Reset tools search state when opening dialog
                              setToolsSearchQuery('');
                            }}
                          >
                            <div className="flex items-center justify-between p-2.5 h-full">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <div className="relative">
                                    <img
                                      src={server.icon || 'placeholder-icon.svg'}
                                      alt={server.name || 'MCP Server'}
                                      className="w-5 h-5 object-contain"
                                      onError={(e) => {
                                        e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'
                                      }}
                                    />
                                  </div>
                                  <span className="font-medium text-sm">{server.name || 'Unknown Server'}</span>
                                </div>
                                {/* Add description line to match height of LLM model items */}
                                <div className="text-xs text-muted-foreground mt-0.5 ml-7">
                                  {selectedTools.length > 0
                                    ? `${selectedTools.length} tool${selectedTools.length !== 1 ? 's' : ''} selected`
                                    : 'No tools selected'}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {selectedTools.length > 0 && (
                                  <Badge variant="outline" className="text-xs font-normal">
                                    {selectedTools.length}/{totalTools}
                                  </Badge>
                                )}
                                <ChevronsUpDown className="h-4 w-4 opacity-70" />
                              </div>
                            </div>
                          </div>
                        );
                      }).filter(Boolean)}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="h-[268px] flex items-center justify-center">
                <div className="text-center p-3 border rounded-md bg-muted/10">
                  <p className="text-xs text-muted-foreground">No MCP servers available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Communication Preferences card */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium">Communication Preferences</h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-medium">Optional</Badge>
          </div>
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-foreground mb-4">Set how your agent should communicate</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Communication Tone</label>
              <Select
                key={`tone-select-${selectResetKey}`}
                value={selectedTone?.toString()}
                onValueChange={(value) => {
                  updateLocalChanges({
                    styles: [...(selectedStyle ? [selectedStyle] : []), parseInt(value)],
                  })
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Available Tones</SelectLabel>
                    {tones?.map((tone) => (
                      <SelectItem key={tone.id} value={tone.id.toString()}>
                        {tone.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Response Style</label>
              <Select
                key={`style-select-${selectResetKey}`}
                value={selectedStyle?.toString()}
                onValueChange={(value) => updateLocalChanges({
                  styles: [...(selectedTone ? [selectedTone] : []), parseInt(value)]
                })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Available Styles</SelectLabel>
                    {styles?.map((style) => (
                      <SelectItem key={style.id} value={style.id.toString()}>
                        {style.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Instructions Section */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium">Agent Instructions</h2>
          <Select
            onValueChange={(value) => {
              const template = templates.find((t) => t.id === value);
              if (template) applyTemplate(template);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Quick Templates" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Templates</SelectLabel>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-foreground mb-4">Describe what your agent should do and how it should behave</p>

          <div className="space-y-4">
            <div className="flex gap-2 mb-3 flex-wrap">
              <span className="text-sm font-medium mb-1 w-full">Available Variables:</span>
              {DYNAMIC_VARIABLES.map((variable) => (
                <button
                  key={variable}
                  onClick={() => insertVariable(variable)}
                  className="text-xs px-3 py-1.5 border rounded-md hover:bg-muted/50 transition-colors flex items-center gap-1"
                >
                  <span className="text-primary">+</span> {variable}
                </button>
              ))}
            </div>

            <Textarea
              value={currentAgent?.instruction}
              onChange={(e) => {
                updateLocalChanges({
                  instruction: e.target.value
                })
              }}
              className="min-h-[350px] w-full font-mono text-sm resize-y break-words"
              style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
              placeholder="Enter detailed instructions for your agent..."
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderActivitiesContent = () => {
    const itemsPerPage = 10;
    const totalPages = Math.ceil(agentRequests.length / itemsPerPage);

    return (
      <div className="space-y-6">
        <div className="rounded-lg border">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="text-base font-medium">Recent Activities</h2>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs flex items-center px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Time</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Request</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Model</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">MCP Servers</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Response</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Cost</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {agentRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((request) => (
                  <tr key={request.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2.5 text-sm whitespace-nowrap">{request.timestamp}</td>
                    <td className="px-3 py-2.5 text-sm max-w-[180px] truncate">{request.request}</td>
                    <td className="px-3 py-2.5 text-sm whitespace-nowrap">{request.model}</td>
                    <td className="px-3 py-2.5 text-sm">
                      {request.mcpServers.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {request.mcpServers.slice(0, 2).map((server) => (
                            <span key={server} className="inline-block text-xs px-1.5 py-0.5 rounded-full bg-muted">
                              {server}
                            </span>
                          ))}
                          {request.mcpServers.length > 2 && (
                            <span className="inline-block text-xs px-1.5 py-0.5 rounded-full bg-muted">
                              +{request.mcpServers.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-sm whitespace-nowrap">{request.responseTime}</td>
                    <td className="px-3 py-2.5 text-sm whitespace-nowrap">{request.cost}</td>
                    <td className="px-3 py-2.5 text-sm whitespace-nowrap">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${request.status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                        }`}>
                        {request.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {agentRequests.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No activity records found</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 mx-auto max-w-5xl w-full">
      {/* Header */}
      <div className="border-b pb-6 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">
          {isMainAgent ? "Main Agent" : (isNewAgent ? "Create Agent" : (
            nameUpdated ? (
              <AnimatedText text={nameUpdated} />
            ) : (
              agent?.name?.length ? agent.name : "New Agent"
            )
          ))}
        </h1>
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Configure your {isMainAgent ? "main AI agent" : "agent"} with models, tools, tone, and communication style
          </p>
          <div>
            {!isMainAgent && !isNewAgent && (
              <Button
                variant="destructive"
                size='icon'
                onClick={handleDelete}
                className="flex items-center"
                disabled={isNewAgent || !agent?.id}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content with tabs */}
      {
        isNewAgent ? renderConfigurationContent() : (
          <Tabs
            defaultValue="configurations"
            className="w-full"
            onValueChange={(value) => setActiveTab(value)}
          >
            <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-auto mb-6">
              <TabsTrigger
                value="configurations"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurations
              </TabsTrigger>
              <TabsTrigger
                value="activities"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <Activity className="h-4 w-4 mr-2" />
                Activities
              </TabsTrigger>
            </TabsList>
            <TabsContent value="configurations" className="space-y-8 pt-6">
              {renderConfigurationContent()}
            </TabsContent>

            <TabsContent value="activities">
              {renderActivitiesContent()}
            </TabsContent>
          </Tabs>
        )
      }

      {/* Action buttons - only show when on Configurations tab */}
      {activeTab === 'configurations' && !(isNewAgent ? false : (!hasChanges || isCreateButtonDisabled)) && (
        <div className="sticky bottom-4 flex justify-between items-center px-4 py-3 mx-3 rounded-lg bg-background shadow-md border animate-in slide-in-from-bottom duration-300 fade-in">
          <h2 className="text-base font-medium">
            {isNewAgent ? (
              isCreateButtonDisabled ? (
                hasChanges ? `Missing field: ${[
                  !currentAgent?.instruction ? "Instruction" : "",
                  !currentAgent?.llmId ? "LLM Model" : "",
                ].filter(t => t).join(", ")}` :
                  "Please fill in required fields") : "Ready to create your agent!"
            ) : (
              "You have unsaved changes"
            )}
          </h2>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <Button
                variant='ghost'
                className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                onClick={() => {
                  setLocalChanges({});
                  setHasChanges(false);
                  setSelectResetKey(prev => prev + 1); // Force re-render of select components
                }}
              >
                Reset
              </Button>
            )}
            <Button
              variant='default'
              onClick={handleSave}
              className="flex items-center"
              disabled={isNewAgent ? isCreateButtonDisabled : (!hasChanges || isCreateButtonDisabled)}
            >
              <Save className="h-4 w-4 mr-2" />
              {isNewAgent ? "Create Agent" : "Save Changes"}
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{agent?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Server Tools Selection Dialog */}
      <Dialog open={serverToolsDialogOpen} onOpenChange={setServerToolsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {activeServer?.icon && (
                <img
                  src={activeServer.icon}
                  alt={activeServer.name || 'MCP Server'}
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'
                  }}
                />
              )}
              {activeServer?.name || 'Unknown Server'} Tools
            </DialogTitle>
            <DialogDescription>
              Select the tools your agent can access from this server
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const allTools = activeServer?.available_tools || [];
                  const serverId = activeServer?.id;
                  if (!serverId) return; // Guard against undefined serverId

                  const currentTools = currentAgent?.mcpTools?.[serverId] || [];
                  const allSelected = allTools.every((tool: any) => currentTools.includes(tool.id));

                  if (allSelected) {
                    // Deselect all
                    const updatedMcpTools = { ...(currentAgent?.mcpTools || {}) };
                    updatedMcpTools[serverId] = [];
                    updateLocalChanges({ mcpTools: updatedMcpTools });
                  } else {
                    // Select all
                    const updatedMcpTools = { ...(currentAgent?.mcpTools || {}) };
                    updatedMcpTools[serverId] = [...allTools.map((tool: any) => tool.id)];
                    updateLocalChanges({ mcpTools: updatedMcpTools });
                  }
                }}
              >
                {(() => {
                  const allTools = activeServer?.available_tools || [];
                  const serverId = activeServer?.id;
                  if (!serverId) return "Select All";

                  const currentTools = currentAgent?.mcpTools?.[serverId] || [];
                  return allTools.every((tool: any) => currentTools.includes(tool.id)) ? "Deselect All" : "Select All";
                })()}
              </Button>

              <span className="text-xs text-muted-foreground">
                {(() => {
                  const allTools = activeServer?.available_tools || [];
                  const serverId = activeServer?.id;
                  if (!serverId) return "0/0 selected";

                  const selectedCount = (currentAgent?.mcpTools?.[serverId] || []).length;
                  return `${selectedCount}/${allTools.length} selected`;
                })()}
              </span>
            </div>

            {/* Search tools */}
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search tools..."
                className="pl-9 h-9"
                value={toolsSearchQuery}
                onChange={(e) => {
                  setToolsSearchQuery(e.target.value);
                }}
              />
            </div>

            {/* Tools with scrolling */}
            {(() => {
              const allTools = activeServer?.available_tools || [];
              const serverId = activeServer?.id;

              if (!allTools.length) {
                return (
                  <div className="p-4 text-center border rounded-md">
                    <p className="text-sm text-muted-foreground">
                      No tools available from this server
                    </p>
                  </div>
                );
              }

              const filteredTools = allTools.filter((tool: any) =>
                (tool?.title ?? tool?.name ?? tool?.id)?.toLowerCase().includes(toolsSearchQuery.toLowerCase())
              );

              if (filteredTools.length === 0) {
                return (
                  <div className="p-4 text-center border rounded-md">
                    <p className="text-sm text-muted-foreground">No tools match your search</p>
                  </div>
                );
              }

              return (
                <div className="border rounded-md overflow-hidden h-[320px]">
                  <div className="h-full overflow-y-auto">
                    {filteredTools.map((tool: any, index: number) => {
                      if (!serverId) return null; // Skip if serverId is undefined

                      return (
                        <div
                          key={tool.id}
                          className={`flex items-center gap-2 p-3 hover:bg-muted/30 ${index !== filteredTools.length - 1 ? 'border-b' : ''
                            }`}
                        >
                          <Checkbox
                            id={`${serverId}-${tool.id}`}
                            checked={serverId ? (currentAgent?.mcpTools?.[serverId] || []).includes(tool.id) : false}
                            onCheckedChange={(checked) => {
                              if (!serverId) return;
                              const currentTools = currentAgent?.mcpTools?.[serverId] || [];
                              const updatedTools = checked
                                ? [...currentTools, tool.id]
                                : currentTools.filter((t: string) => t !== tool.id);
                              handleToolSelection(serverId, updatedTools);
                            }}
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={`${serverId}-${tool.id}`}
                              className="text-sm cursor-pointer block font-medium"
                            >
                              {tool.title || tool.name || tool.id}
                            </label>
                            {tool.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {tool.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    }).filter(Boolean)}
                  </div>
                </div>
              );
            })()}
          </div>

          <DialogFooter>
            <Button onClick={() => {
              setServerToolsDialogOpen(false);
              setToolsSearchQuery('');
            }}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Navigation confirmation dialog */}
      <Dialog open={showNavigationDialog} onOpenChange={setShowNavigationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Are you sure you want to leave this page?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleNavigationCancel}
            >
              Stay
            </Button>
            <Button
              variant="default"
              onClick={handleNavigationConfirm}
            >
              Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}