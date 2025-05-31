import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useMatches } from "@tanstack/react-router"
import { Activity, Check, ChevronLeft, ChevronRight, Info, Save, Settings, Trash2 } from "lucide-react"
import { useState } from "react"

interface LLMModel {
  id: string
  name: string
  provider: string
  description: string
}

interface MCPServer {
  id: string
  name: string
  description: string
  capabilities: string[]
  installed: boolean
  active?: boolean
  logoUrl: string
}

interface Template {
  id: string
  name: string
  description: string
  content: string
}

interface Tone {
  id: string
  name: string
  description: string
}

interface Style {
  id: string
  name: string
  description: string
}

const mockModels: LLMModel[] = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', description: 'Most capable model for complex tasks' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', description: 'Fast and efficient for most tasks' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', description: 'Excellent for analysis and reasoning' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', description: 'Balanced performance and speed' },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google', description: 'Multimodal capabilities' }
]

const mockServers: MCPServer[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Access Gmail functionality',
    capabilities: ['Send Email', 'Read Email', 'Search Mail'],
    installed: true,
    active: true,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg'
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Integrate with Slack workspaces',
    capabilities: ['Send Messages', 'Read Channels', 'File Upload'],
    installed: true,
    active: false,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg'
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Access GitHub repositories',
    capabilities: ['Repository Access', 'Issue Management', 'Pull Requests'],
    installed: true,
    active: true,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg'
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Connect to Notion workspaces',
    capabilities: ['Database Access', 'Page Creation', 'Content Search'],
    installed: true,
    active: false,
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png'
  }
]

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

const tones: Tone[] = [
  { id: 'professional', name: 'Professional', description: 'Formal and business-appropriate tone' },
  { id: 'friendly', name: 'Friendly', description: 'Warm and approachable communication' },
  { id: 'casual', name: 'Casual', description: 'Relaxed and informal interaction' },
  { id: 'technical', name: 'Technical', description: 'Precise and detailed technical language' },
  { id: 'creative', name: 'Creative', description: 'Imaginative and expressive style' },
  { id: 'concise', name: 'Concise', description: 'Brief and to-the-point responses' }
]

const styles: Style[] = [
  { id: 'detailed', name: 'Detailed', description: 'Comprehensive explanations with examples' },
  { id: 'bullet-points', name: 'Bullet Points', description: 'Structured lists and key points' },
  { id: 'step-by-step', name: 'Step-by-step', description: 'Clear sequential instructions' },
  { id: 'conversational', name: 'Conversational', description: 'Natural dialogue format' },
  { id: 'analytical', name: 'Analytical', description: 'Data-driven insights and reasoning' },
  { id: 'storytelling', name: 'Storytelling', description: 'Narrative-based explanations' }
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
  const agentId = matches[matches.length - 1]?.params?.agentId || ''

  const [selectedModel, setSelectedModel] = useState<string>('')
  const [selectedServers, setSelectedServers] = useState<Set<string>>(new Set())
  const [description, setDescription] = useState('')
  const [selectedTone, setSelectedTone] = useState<string>('')
  const [selectedStyle, setSelectedStyle] = useState<string>('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('configurations')

  // Pagination state for activities
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const installedServers = mockServers.filter(server => server.installed)
  const charactersUsed = description.length
  const charactersRemaining = CHARACTER_LIMIT - charactersUsed

  const toggleServer = (serverId: string) => {
    const newSelected = new Set(selectedServers)
    if (newSelected.has(serverId)) {
      newSelected.delete(serverId)
    } else {
      newSelected.add(serverId)
    }
    setSelectedServers(newSelected)
    setHasUnsavedChanges(true)
  }

  const applyTemplate = (template: Template) => {
    setDescription(template.content)
    setHasUnsavedChanges(true)
  }

  const insertVariable = (variable: string) => {
    const textarea = document.querySelector('textarea')
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newText = description.substring(0, start) + variable + description.substring(end)
      if (newText.length <= CHARACTER_LIMIT) {
        setDescription(newText)
        setHasUnsavedChanges(true)
        // Restore cursor position
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + variable.length
          textarea.focus()
        }, 0)
      }
    }
  }

  const handleSave = () => {
    // TODO: Implement save functionality
    setHasUnsavedChanges(false)
    console.log('Saving agent configuration...', {
      model: selectedModel,
      servers: Array.from(selectedServers),
      description,
      tone: selectedTone,
      style: selectedStyle
    })
  }

  const handleDelete = () => {
    // TODO: Implement delete functionality
    console.log('Deleting agent...', agentId)
    // Show confirmation dialog and delete agent
  }

  // Helper function to render the configuration content
  const renderConfigurationContent = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Side - Main Agent Tone/Style or Text Editor */}
      <div className="lg:col-span-2 space-y-6">
        {isMainAgent ? (
          // Main Agent: Configuration Options
          <div className="space-y-6">
            {/* Communication Preferences */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-medium text-foreground mb-2">Communication Preferences</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Set how your main agent should communicate with you across all interactions
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tone Selection */}
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium text-foreground">Communication Tone</label>
                  <Select value={selectedTone} onValueChange={(value) => { setSelectedTone(value); setHasUnsavedChanges(true) }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      {tones.map((tone) => (
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
                  <label className="text-sm font-medium text-foreground">Response Style</label>
                  <Select value={selectedStyle} onValueChange={(value) => { setSelectedStyle(value); setHasUnsavedChanges(true) }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      {styles.map((style) => (
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

            {/* Additional Instructions */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-medium text-foreground mb-2">Additional Instructions</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Provide any additional instructions or preferences for your main agent
                </p>
              </div>

              <div className="space-y-2">
                {/* Dynamic Variables - Integrated with textarea */}
                <div className="relative">
                  {/* Compact toolbar directly above textarea */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-muted-foreground">Variables:</span>
                      <div className="flex gap-1">
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
                    value={description}
                    onChange={(e) => {
                      if (e.target.value.length <= CHARACTER_LIMIT) {
                        setDescription(e.target.value)
                        setHasUnsavedChanges(true)
                      }
                    }}
                    placeholder="Enter any specific instructions, preferences, or guidelines for your main agent..."
                    className="min-h-48 resize-none"
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
          </div>
        ) : (
          // Sub Agent or Create Agent: Text Editor
          <div className="space-y-3">
            <h2 className="text-lg font-medium text-foreground">Agent Instructions</h2>
            <p className="text-sm text-muted-foreground">Describe what your agent should do and how it should behave</p>

            {/* Text Editor with integrated dynamic variables */}
            <div className="space-y-2">
              {/* Dynamic Variables - Integrated with textarea */}
              <div className="relative">
                {/* Compact toolbar directly above textarea */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-muted-foreground">Variables:</span>
                    <div className="flex gap-1">
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
                  value={description}
                  onChange={(e) => {
                    if (e.target.value.length <= CHARACTER_LIMIT) {
                      setDescription(e.target.value)
                      setHasUnsavedChanges(true)
                    }
                  }}
                  placeholder="Describe your agent's role, responsibilities, and behavior..."
                  className="min-h-96 resize-none"
                />
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>{charactersUsed} / {CHARACTER_LIMIT} characters</span>
                <span className={charactersRemaining < 100 ? 'text-orange-600 dark:text-orange-400' : ''}>
                  {charactersRemaining} remaining
                </span>
              </div>
            </div>

            {/* Action Buttons - Only for Create Agent or Existing Agent (Delete) */}
            {(isNewAgent || (!isMainAgent && !isNewAgent)) && (
              <div className="flex items-center justify-between pt-4">
                <div>
                </div>

                {/* Right side - Create button (only for new agents) */}
                <div className="flex justify-end flex-1">
                  {isNewAgent && (
                    <Button
                      onClick={handleSave}
                      disabled={!hasUnsavedChanges || !selectedModel || !description.trim()}
                      className="flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Create Agent</span>
                    </Button>
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
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Side - Selectors */}
      <div className="space-y-6">
        {/* LLM Model Selection */}
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-foreground">LLM Model</h2>
          <div className="border border-border rounded-lg p-4 bg-background">
            <Select value={selectedModel} onValueChange={(value) => { setSelectedModel(value); setHasUnsavedChanges(true) }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a language model" />
              </SelectTrigger>
              <SelectContent>
                {mockModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{model.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* MCP Servers Selection */}
        <div className="space-y-3">
          <h2 className="text-lg font-medium text-foreground">MCP Servers</h2>
          <p className="text-sm text-muted-foreground">Select tools and services your agent can access</p>
          <div className="space-y-2">
            {installedServers.map((server) => (
              <div key={server.id} className="border border-border rounded-lg p-3 bg-background">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2 flex-1 min-w-0">
                    <img
                      src={server.logoUrl}
                      alt={`${server.name} logo`}
                      className="w-4 h-4 object-contain mt-0.5 shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{server.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{server.description}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleServer(server.id)}
                    className={`p-1 rounded border transition-colors shrink-0 ml-2 ${selectedServers.has(server.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:border-muted-foreground'
                      }`}
                  >
                    {selectedServers.has(server.id) ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <div className="w-3 h-3" />
                    )}
                  </button>
                </div>
                {server.capabilities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {server.capabilities.map((capability) => (
                      <Badge key={capability} variant="secondary" className="text-xs px-1.5 py-0">
                        {capability}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Templates - Only for Sub/Create Agent */}
        {!isMainAgent && (
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
        )}
      </div>
    </div>
  )  // Helper function to render activities content with pagination
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
    <div className="space-y-8 p-6 mx-auto max-w-5xl">
      {/* Header */}
      <div className={`pb-6 mb-6 ${isNewAgent ? "border-b" : ""}`}>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {isMainAgent ? 'Main Agent' : isNewAgent ? 'Create Agent' : 'Agent Configuration'}
          </h1>
          {!isNewAgent && (
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground" />
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
    </div>
  )
}