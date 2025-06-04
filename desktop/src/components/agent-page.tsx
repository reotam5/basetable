import { MCPToolSelector } from "@/components/mcp-tool-selector"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { use } from "@/hooks/use"
import useAgent from "@/hooks/use-agent"
import { useMatches } from "@tanstack/react-router"
import { Activity, ChevronLeft, ChevronRight, Info, Save, Settings, Trash2 } from "lucide-react"
import { useCallback, useState } from "react"
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

const CHARACTER_LIMIT = 2000
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
  const currentPath = matches[matches.length - 1]?.fullPath
  const currentRoute = (currentPath?.endsWith('/') && currentPath.length > 1) ? currentPath.slice(0, -1) : currentPath;
  const isMainAgent = currentRoute === '/agent'
  const isNewAgent = currentRoute === '/agents'

  // Memoize fetcher functions to prevent infinite re-renders
  const agentsFetcher = useCallback(() => window.electronAPI.agent.getAll(), []);
  const mcpServersFetcher = useCallback(async () => (await window.electronAPI.mcp.getAll({ is_active: true })).map(s => ({ ...s, id: s?.users?.[0]?.User_MCP?.id })), []);
  const llmsFetcher = useCallback(async () => await window.electronAPI.llm.getAll(), []);
  const tonesFetcher = useCallback(async () => await window.electronAPI.agent.getTones(), []);
  const stylesFetcher = useCallback(async () => await window.electronAPI.agent.getStyles(), []);

  const { data } = use({ fetcher: agentsFetcher })
  const mainAgentId = data?.find((agent: any) => agent.is_main)?.id;
  const agentId = isMainAgent ? mainAgentId : matches?.[matches.length - 1]?.params?.agentId ?? null;
  const { data: mcpServers } = use({ fetcher: mcpServersFetcher });
  const { data: llms } = use({ fetcher: llmsFetcher });
  const { data: tones } = use({ fetcher: tonesFetcher });
  const { data: styles } = use({ fetcher: stylesFetcher });
  const { agent, updateAgent, createAgent, deleteAgent } = useAgent(agentId ?? undefined);
  const selectedTone = tones?.find(t => agent?.styles?.includes(t.id))?.id;
  const selectedStyle = styles?.find(s => agent?.styles?.includes(s.id))?.id;
  const [activeTab, setActiveTab] = useState<string>('configurations')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Pagination state for activities
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const charactersUsed = agent?.instruction?.length ?? 0
  const charactersRemaining = CHARACTER_LIMIT - charactersUsed

  const handleToolSelection = (serverId: number, selectedTools: string[]) => {
    const mcpTools = agent?.mcpTools ? { ...agent.mcpTools } : {}

    if (selectedTools.length > 0) {
      mcpTools[serverId] = selectedTools
    } else {
      delete mcpTools[serverId]
    }

    updateAgent({
      mcpTools: mcpTools
    })
  }

  const selectLLM = (llmId: number) => {
    updateAgent({
      llmId: llmId
    })
  }

  const applyTemplate = (template: Template) => {
    updateAgent({
      instruction: template.content
    })
  }

  const insertVariable = (variable: string) => {
    const textarea = document.querySelector('textarea')
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const currentText = agent?.instruction ?? ''
      const newText = currentText?.substring(0, start) + variable + currentText.substring(end)
      if (newText.length <= CHARACTER_LIMIT) {
        updateAgent({
          instruction: newText
        })
        // Restore cursor position
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + variable.length
          textarea.focus()
        }, 0)
      }
    }
  }

  const handleSave = () => {
    createAgent()
  }

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    deleteAgent()
    setShowDeleteDialog(false)
  }  // Helper function to get disabled reason for Create button
  const getCreateButtonDisabledReason = () => {
    const missingFields: string[] = []
    if (!agent?.instruction?.trim()) missingFields.push('instructions')
    if (!agent?.llmId) missingFields.push('model')
    if (!selectedTone) missingFields.push('tone')
    if (!selectedStyle) missingFields.push('style')

    if (missingFields.length === 0) return null

    return `Missing required: ${missingFields.join(', ')}`
  }

  const isCreateButtonDisabled = !agent?.instruction || !agent?.llmId || !selectedTone || !selectedStyle
  const disabledReason = getCreateButtonDisabledReason()

  // Helper function to render the configuration content
  const renderConfigurationContent = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Side - Configuration */}
      <div className="lg:col-span-2 space-y-6">
        <div className="space-y-6">
          {/* Communication Preferences */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-foreground mb-2">Communication Preferences</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Set how your agent should communicate
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tone Selection */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-foreground">
                  Communication Tone {isNewAgent && <span className="text-red-500">*</span>}
                </label>
                <Select value={selectedTone} onValueChange={(value) => updateAgent({
                  styles: [...(selectedStyle ? [selectedStyle] : []), parseInt(value)]
                })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {tones?.map((tone) => (
                      <SelectItem key={tone.id} value={tone.id}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{tone.name}</span>
                          <span className="text-xs text-muted-foreground">{tone.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Style Selection */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-foreground">
                  Response Style {isNewAgent && <span className="text-red-500">*</span>}
                </label>
                <Select value={selectedStyle} onValueChange={(value) => updateAgent({
                  styles: [...(selectedTone ? [selectedTone] : []), parseInt(value)]
                })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    {styles?.map((style) => (
                      <SelectItem key={style.id} value={style.id}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{style.name}</span>
                          <span className="text-xs text-muted-foreground">{style.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Agent Instructions */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-foreground mb-2">
                Agent Instructions {isNewAgent && <span className="text-red-500">*</span>}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Describe what your agent should do and how it should behave
              </p>
            </div>

            <div className="space-y-2">
              {/* Dynamic Variables - Integrated with textarea */}
              <div className="relative">
                {/* Compact toolbar directly above textarea */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-medium text-muted-foreground">Variables:</span>
                    <div className="flex flex-wrap gap-1">
                      {DYNAMIC_VARIABLES.map((variable) => (
                        <Tooltip key={variable}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => insertVariable(variable)}
                              className="px-2 py-1 text-xs font-mono text-muted-foreground bg-muted/50 border border-border rounded hover:bg-muted hover:text-foreground transition-colors"
                            >
                              {variable}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              {variable === '{{user_name}}' && 'Inserts the current user\'s name'}
                              {variable === '{{mcp_servers}}' && 'Lists the available MCP servers and tools'}
                              {variable === '{{current_date}}' && 'Inserts the current date'}
                              {variable === '{{current_time}}' && 'Inserts the current time'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                </div>
                <Textarea
                  value={agent?.instruction}
                  onChange={(e) => {
                    if (e.target.value.length <= CHARACTER_LIMIT) {
                      updateAgent({
                        instruction: e.target.value
                      })
                    }
                  }}
                  placeholder="Describe your agent's role, responsibilities, and behavior..."
                  className="min-h-64 resize-none"
                />
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>{charactersUsed} / {CHARACTER_LIMIT} characters</span>
                <span className={charactersRemaining < 100 ? 'text-orange-600 dark:text-orange-400' : ''}>
                  {charactersRemaining} remaining
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons - Desktop only (large screens) */}
          {(isNewAgent || (!isMainAgent && !isNewAgent)) && (
            <div className="hidden lg:flex justify-end pt-6">
              {isNewAgent && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        onClick={handleSave}
                        disabled={isCreateButtonDisabled}
                        className="flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>Create Agent</span>
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {disabledReason && (
                    <TooltipContent>
                      <p className="text-xs">{disabledReason}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              )}
              {!isMainAgent && !isNewAgent && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Agent</span>
                </Button>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Right Side - Selectors */}
      <div className="space-y-6">
        {/* LLM Model Selection */}
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-foreground">
            LLM Model {isNewAgent && <span className="text-red-500">*</span>}
          </h2>
          <div className="border border-border rounded-lg p-4 bg-background">
            <Select value={agent?.llmId as any} onValueChange={(llm) => selectLLM(parseInt(llm))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a language model" />
              </SelectTrigger>
              <SelectContent>
                {(() => {
                  // Group LLMs by provider
                  const groupedLLMs = llms?.reduce((acc, llm) => {
                    if (!acc[llm.provider]) {
                      acc[llm.provider] = [];
                    }
                    acc[llm.provider].push(llm);
                    return acc;
                  }, {} as Record<string, any[]>) || {};

                  return Object.entries(groupedLLMs).map(([provider, models]) => (
                    <SelectGroup key={provider}>
                      <SelectLabel>{provider}</SelectLabel>
                      {(models as any[]).map((llm: any) => (
                        <SelectItem key={llm.id} value={llm.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{llm.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ));
                })()}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* MCP Servers Selection */}
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-foreground">MCP Servers</h2>
          <p className="text-sm text-muted-foreground">Select tools and services your agent can access</p>
          <MCPToolSelector
            servers={mcpServers || []}
            selectedTools={agent?.mcpTools || {}}
            onToolSelectionChange={handleToolSelection}
          />
        </div>

        {/* Quick Templates */}
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-foreground">Quick Templates</h2>
          <div className="space-y-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => applyTemplate(template)}
                className="w-full p-3 text-left border border-border rounded-lg hover:border-muted-foreground transition-colors bg-background"
              >
                <div className="font-medium text-sm">{template.name}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // Helper function to render activities content with pagination
  const renderActivitiesContent = () => {
    const totalItems = agentRequests.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentItems = agentRequests.slice(startIndex, endIndex)

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-foreground">Activities</h3>
            <p className="text-sm text-muted-foreground">AI requests handled by this agent</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div>
          <div className="space-y-0 font-mono text-sm bg-muted/30 border-l-2 border-muted-foreground/20">
            {currentItems.map((request) => (
              <div key={request.id} className="flex items-start space-x-2 px-3 py-2 hover:bg-muted/50 border-l-2 border-transparent hover:border-muted-foreground/40 transition-colors">
                <span className="text-muted-foreground/60 whitespace-nowrap text-xs mt-0.5 w-32">
                  {request.timestamp}
                </span>
                <div
                  className={`w-1 h-1 rounded-full mt-2 flex-shrink-0 ${request.status === "success" ? "bg-green-500" : "bg-red-500"
                    }`}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-foreground">
                    {request.request}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    [{request.model}]
                  </span>
                  <span className="text-muted-foreground ml-1">
                    {request.responseTime}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    {request.cost}
                  </span>
                  {request.mcpServers.length > 0 && (
                    <span className="text-blue-600 ml-2">
                      via {request.mcpServers.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 mx-auto max-w-5xl w-full">
      {/* Header */}
      <div className={`pb-6 mb-6 ${isNewAgent ? "border-b" : ""}`}>
        <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">
            {isMainAgent ? (agent?.name ?? 'Main Agent') : isNewAgent ? 'Create Agent' : agent?.name}
          </h1>
          {!isNewAgent && (
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {isMainAgent
                    ? 'Your main agent handles all AI interactions by default'
                    : 'Specialized agents can be created for specific tasks'
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          {isMainAgent
            ? 'Configure your main AI agent with models, tools, tone, and communication style'
            : isNewAgent
              ? 'Create a specialized AI agent with custom instructions, models, and tools'
              : 'Configure your AI agent with models, tools, and behavior instructions'
          }
        </p>
      </div>

      {/* Tabs for main/sub agent scenarios */}
      {!isNewAgent ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="configurations" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configurations
            </TabsTrigger>
            <TabsTrigger value="recent-activities" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Activities
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configurations" className="space-y-6">
            {/* Configuration Content */}
            {renderConfigurationContent()}
          </TabsContent>

          <TabsContent value="recent-activities" className="space-y-6">
            {/* Activities Content */}
            {renderActivitiesContent()}
          </TabsContent>
        </Tabs>
      ) : (
        /* Create Agent Scenario - No tabs, just configuration */
        <div className="space-y-6">
          {renderConfigurationContent()}
        </div>
      )}

      {/* Action Buttons - Visible on small screens only, placed after all content */}
      {(isNewAgent || (!isMainAgent && !isNewAgent)) && (
        <div className="flex justify-end pt-6 lg:hidden">
          {isNewAgent && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    onClick={handleSave}
                    disabled={isCreateButtonDisabled}
                    className="flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Create Agent</span>
                  </Button>
                </span>
              </TooltipTrigger>
              {disabledReason && (
                <TooltipContent>
                  <p className="text-xs">{disabledReason}</p>
                </TooltipContent>
              )}
            </Tooltip>
          )}
          {!isMainAgent && !isNewAgent && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Agent</span>
            </Button>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{agent?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}