import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  MessageSquare,
  Server,
  TrendingUp,
} from "lucide-react"
import { useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const usageData = [
  { name: "Mon", requests: 45, cost: 2.3 },
  { name: "Tue", requests: 52, cost: 3.1 },
  { name: "Wed", requests: 38, cost: 1.9 },
  { name: "Thu", requests: 61, cost: 4.2 },
  { name: "Fri", requests: 73, cost: 5.1 },
  { name: "Sat", requests: 29, cost: 1.4 },
  { name: "Sun", requests: 34, cost: 1.8 },
]

const modelUsage = [
  { name: "Local Llama", value: 45, color: "#10b981" },
  { name: "Claude", value: 25, color: "#8b5cf6" },
  { name: "GPT-4", value: 20, color: "#3b82f6" },
  { name: "Codestral", value: 10, color: "#f59e0b" },
]

const allRequests = [
  {
    id: "1",
    timestamp: "2024-05-30 14:28",
    request: "Summarize latest emails from inbox",
    model: "Claude 3.5 Sonnet",
    mcpServers: ["Gmail"],
    responseTime: "1.2s",
    cost: "$0.023",
    status: "success",
  },
  {
    id: "2",
    timestamp: "2024-05-30 14:15",
    request: "Write Python function for data processing",
    model: "Local Codestral",
    mcpServers: [],
    responseTime: "0.8s",
    cost: "Free",
    status: "success",
  },
  {
    id: "3",
    timestamp: "2024-05-30 13:50",
    request: "Check calendar for conflicts tomorrow",
    model: "GPT-4",
    mcpServers: ["Google Calendar"],
    responseTime: "1.1s",
    cost: "$0.015",
    status: "success",
  },
  {
    id: "4",
    timestamp: "2024-05-30 13:30",
    request: "Analyze project files in /src directory",
    model: "Local Llama 3.1",
    mcpServers: ["File System"],
    responseTime: "2.1s",
    cost: "Free",
    status: "success",
  },
  {
    id: "5",
    timestamp: "2024-05-30 13:10",
    request: "Generate SQL query for user analytics",
    model: "Claude 3.5 Sonnet",
    mcpServers: ["Database"],
    responseTime: "0.9s",
    cost: "$0.019",
    status: "success",
  },
  {
    id: "6",
    timestamp: "2024-05-30 12:45",
    request: "Send team update to #general channel",
    model: "Claude 3.5 Sonnet",
    mcpServers: ["Slack"],
    responseTime: "1.5s",
    cost: "$0.018",
    status: "success",
  },
  {
    id: "7",
    timestamp: "2024-05-30 12:20",
    request: "Translate document to Spanish",
    model: "GPT-4",
    mcpServers: [],
    responseTime: "2.3s",
    cost: "$0.031",
    status: "success",
  },
  {
    id: "8",
    timestamp: "2024-05-30 12:00",
    request: "Access Notion database for project notes",
    model: "GPT-4",
    mcpServers: ["Notion"],
    responseTime: "-",
    cost: "-",
    status: "error",
  },
  {
    id: "9",
    timestamp: "2024-05-30 11:40",
    request: "Optimize React component performance",
    model: "Local Codestral",
    mcpServers: ["File System"],
    responseTime: "1.7s",
    cost: "Free",
    status: "success",
  },
  {
    id: "10",
    timestamp: "2024-05-30 11:15",
    request: "Create meeting notes from recording",
    model: "Claude 3.5 Sonnet",
    mcpServers: ["Audio Transcription"],
    responseTime: "4.2s",
    cost: "$0.045",
    status: "success",
  },
  {
    id: "11",
    timestamp: "2024-05-30 10:55",
    request: "Debug authentication error in API",
    model: "Local Llama 3.1",
    mcpServers: ["File System", "Database"],
    responseTime: "3.1s",
    cost: "Free",
    status: "success",
  },
  {
    id: "12",
    timestamp: "2024-05-30 10:30",
    request: "Generate test cases for login flow",
    model: "Local Codestral",
    mcpServers: [],
    responseTime: "1.4s",
    cost: "Free",
    status: "success",
  },
  {
    id: "13",
    timestamp: "2024-05-30 10:05",
    request: "Update Jira ticket with progress",
    model: "GPT-4",
    mcpServers: ["Jira"],
    responseTime: "-",
    cost: "-",
    status: "error",
  },
  {
    id: "14",
    timestamp: "2024-05-30 09:45",
    request: "Explain TypeScript generics with examples",
    model: "Local Llama 3.1",
    mcpServers: [],
    responseTime: "2.8s",
    cost: "Free",
    status: "success",
  },
  {
    id: "15",
    timestamp: "2024-05-30 09:20",
    request: "Draft email response to client inquiry",
    model: "Claude 3.5 Sonnet",
    mcpServers: ["Gmail"],
    responseTime: "1.6s",
    cost: "$0.024",
    status: "success",
  },
  {
    id: "16",
    timestamp: "2024-05-30 08:55",
    request: "Review pull request #247",
    model: "Local Codestral",
    mcpServers: ["GitHub"],
    responseTime: "2.9s",
    cost: "Free",
    status: "success",
  },
  {
    id: "17",
    timestamp: "2024-05-30 08:30",
    request: "Generate API documentation",
    model: "GPT-4",
    mcpServers: ["File System"],
    responseTime: "3.5s",
    cost: "$0.038",
    status: "success",
  },
  {
    id: "18",
    timestamp: "2024-05-30 08:05",
    request: "Parse CSV data and create summary",
    model: "Local Llama 3.1",
    mcpServers: ["File System"],
    responseTime: "4.1s",
    cost: "Free",
    status: "success",
  },
  {
    id: "19",
    timestamp: "2024-05-30 07:40",
    request: "Schedule follow-up meeting",
    model: "Claude 3.5 Sonnet",
    mcpServers: ["Google Calendar"],
    responseTime: "1.3s",
    cost: "$0.016",
    status: "success",
  },
  {
    id: "20",
    timestamp: "2024-05-30 07:15",
    request: "Connect to production database",
    model: "GPT-4",
    mcpServers: ["Database"],
    responseTime: "-",
    cost: "-",
    status: "error",
  },
]

export function Dashboard() {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8
  const totalPages = Math.ceil(allRequests.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRequests = allRequests.slice(startIndex, endIndex)

  return (
    <div className="space-y-8 p-6 mx-auto max-w-5xl">
      <div className="border-b pb-6 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Overview of your AI Control Center activity and performance
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <div className="border border-border rounded-lg p-4 bg-background">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-foreground">System Health</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">API Response Time</span>
              <Badge variant="outline" className="text-green-600 border-green-200">Excellent</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">MCP Server Connectivity</span>
              <Badge variant="outline" className="text-yellow-600 border-yellow-200">Good</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Routing Accuracy</span>
              <Badge variant="outline" className="text-green-600 border-green-200">98.5%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cost Efficiency</span>
              <Badge variant="outline" className="text-green-600 border-green-200">Optimized</Badge>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-border rounded-lg p-4 bg-background">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold text-foreground">1,247</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12% from last week
                </p>
              </div>
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          <div className="border border-border rounded-lg p-4 bg-background">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold text-foreground">$47.32</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  -8% from last week
                </p>
              </div>
              <DollarSign className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          <div className="border border-border rounded-lg p-4 bg-background">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold text-foreground">1.4s</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  -0.2s improvement
                </p>
              </div>
              <Clock className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          <div className="border border-border rounded-lg p-4 bg-background">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Servers</p>
                <p className="text-2xl font-bold text-foreground">6/8</p>
                <p className="text-xs text-yellow-600 flex items-center mt-1">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  2 servers offline
                </p>
              </div>
              <Server className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Chart */}
        <div className="border border-border rounded-lg p-4 bg-background">
          <div className="mb-3">
            <h3 className="text-lg font-medium text-foreground">Weekly Usage</h3>
            <p className="text-sm text-muted-foreground">Requests and costs over the past week</p>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="requests" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Distribution */}
        <div className="border border-border rounded-lg p-4 bg-background">
          <div className="mb-3">
            <h3 className="text-lg font-medium text-foreground">Model Usage Distribution</h3>
            <p className="text-sm text-muted-foreground">Breakdown of requests by AI model</p>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={modelUsage}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {modelUsage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Requests */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-foreground">Recent Requests</h3>
            <p className="text-sm text-muted-foreground">Latest AI requests and their routing decisions</p>
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
            {currentRequests.map((request) => (
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
    </div>
  )
}