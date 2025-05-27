import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Activity,
    AlertTriangle,
    Brain,
    CheckCircle,
    Clock,
    DollarSign,
    MessageSquare,
    Server,
    TrendingUp,
    Zap,
} from "lucide-react"
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

const recentRequests = [
  {
    id: "1",
    timestamp: "2 min ago",
    request: "Summarize latest emails",
    model: "Claude 3.5 Sonnet",
    mcpServers: ["Gmail"],
    responseTime: "1.2s",
    cost: "$0.023",
    status: "success",
  },
  {
    id: "2",
    timestamp: "5 min ago",
    request: "Write Python function for data processing",
    model: "Local Codestral",
    mcpServers: [],
    responseTime: "0.8s",
    cost: "Free",
    status: "success",
  },
  {
    id: "3",
    timestamp: "12 min ago",
    request: "Analyze project files",
    model: "Local Llama 3.1",
    mcpServers: ["File System"],
    responseTime: "2.1s",
    cost: "Free",
    status: "success",
  },
  {
    id: "4",
    timestamp: "18 min ago",
    request: "Send team update to Slack",
    model: "Claude 3.5 Sonnet",
    mcpServers: ["Slack"],
    responseTime: "1.5s",
    cost: "$0.018",
    status: "success",
  },
  {
    id: "5",
    timestamp: "25 min ago",
    request: "Access Notion database",
    model: "GPT-4",
    mcpServers: ["Notion"],
    responseTime: "-",
    cost: "-",
    status: "error",
  },
]

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of your AI Control Center activity and performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">1,247</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12% from last week
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-gray-900">$47.32</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  -8% from last week
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900">1.4s</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  -0.2s improvement
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Servers</p>
                <p className="text-2xl font-bold text-gray-900">6/8</p>
                <p className="text-xs text-yellow-600 flex items-center mt-1">
                  <AlertTriangle className="w-3 h-3 mr-1" />2 servers offline
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Server className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Usage</CardTitle>
            <CardDescription>Requests and costs over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="requests" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Model Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Model Usage Distribution</CardTitle>
            <CardDescription>Breakdown of requests by AI model</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={modelUsage}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
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
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Requests</CardTitle>
              <CardDescription>Latest AI requests and their routing decisions</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Activity className="w-4 h-4 mr-2" />
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`w-2 h-2 rounded-full ${request.status === "success" ? "bg-green-500" : "bg-red-500"}`}
                  />

                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">{request.request}</div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Brain className="w-3 h-3" />
                        {request.model}
                      </span>
                      {request.mcpServers.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Server className="w-3 h-3" />
                          {request.mcpServers.join(", ")}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {request.responseTime}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{request.cost}</div>
                    <div className="text-xs text-gray-500">{request.timestamp}</div>
                  </div>
                  {request.status === "success" ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <MessageSquare className="w-4 h-4 mr-2" />
              Start New Chat
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Server className="w-4 h-4 mr-2" />
              Check Server Status
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Brain className="w-4 h-4 mr-2" />
              Test Routing Rules
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Response Time</span>
              <Badge className="bg-green-100 text-green-800">Excellent</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">MCP Server Connectivity</span>
              <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Routing Accuracy</span>
              <Badge className="bg-green-100 text-green-800">98.5%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cost Efficiency</span>
              <Badge className="bg-green-100 text-green-800">Optimized</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}