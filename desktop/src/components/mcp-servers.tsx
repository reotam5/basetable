import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Activity,
    AlertCircle,
    Calendar,
    CheckCircle,
    Cloud,
    Database,
    Download,
    FileText,
    FolderOpen,
    Github,
    Mail,
    MessageSquare,
} from "lucide-react"
import { useState } from "react"

interface MCPServer {
  id: string
  name: string
  description: string
  icon: any
  status: "active" | "inactive" | "error"
  installed: boolean
  capabilities: string[]
  lastActivity?: string
}

const availableServers: MCPServer[] = [
  {
    id: "gmail",
    name: "Gmail",
    description: "Access and manage Gmail emails, compose messages, search inbox",
    icon: Mail,
    status: "active",
    installed: true,
    capabilities: ["Read emails", "Send emails", "Search", "Labels"],
    lastActivity: "2 minutes ago",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send messages, read channels, manage workspace communications",
    icon: MessageSquare,
    status: "active",
    installed: true,
    capabilities: ["Send messages", "Read channels", "File sharing"],
    lastActivity: "5 minutes ago",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Repository management, code review, issue tracking",
    icon: Github,
    status: "inactive",
    installed: true,
    capabilities: ["Repository access", "Issue management", "Pull requests"],
    lastActivity: "1 hour ago",
  },
  {
    id: "filesystem",
    name: "File System",
    description: "Read, write, and manage local files and directories",
    icon: FolderOpen,
    status: "active",
    installed: true,
    capabilities: ["File operations", "Directory listing", "Search"],
    lastActivity: "30 seconds ago",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Access Notion databases, pages, and workspace content",
    icon: FileText,
    status: "error",
    installed: true,
    capabilities: ["Database queries", "Page creation", "Content search"],
    lastActivity: "Error 10 minutes ago",
  },
  {
    id: "calendar",
    name: "Google Calendar",
    description: "Schedule meetings, check availability, manage events",
    icon: Calendar,
    status: "active",
    installed: false,
    capabilities: ["Event management", "Scheduling", "Availability"],
  },
  {
    id: "database",
    name: "PostgreSQL",
    description: "Query databases, run analytics, manage data",
    icon: Database,
    status: "inactive",
    installed: false,
    capabilities: ["SQL queries", "Data analysis", "Schema management"],
  },
  {
    id: "aws",
    name: "AWS Services",
    description: "Manage AWS resources, S3, EC2, Lambda functions",
    icon: Cloud,
    status: "inactive",
    installed: false,
    capabilities: ["Resource management", "Monitoring", "Deployment"],
  },
]

export function MCPServers() {
  const [servers, setServers] = useState<MCPServer[]>(availableServers)

  const toggleServer = (id: string) => {
    setServers((prev) =>
      prev.map((server) =>
        server.id === id ? { ...server, status: server.status === "active" ? "inactive" : "active" } : server,
      ),
    )
  }

  const installServer = (id: string) => {
    setServers((prev) =>
      prev.map((server) => (server.id === id ? { ...server, installed: true, status: "active" } : server)),
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />
    }
  }

  const installedServers = servers.filter((s) => s.installed)
  const availableToInstall = servers.filter((s) => !s.installed)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">MCP Servers</h1>
        <p className="text-gray-600">Manage Model Context Protocol servers that extend AI capabilities</p>
      </div>

      <Tabs defaultValue="installed" className="space-y-6">
        <TabsList>
          <TabsTrigger value="installed">Installed Servers ({installedServers.length})</TabsTrigger>
          <TabsTrigger value="available">Available ({availableToInstall.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="installed" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {installedServers.map((server) => (
              <Card key={server.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <server.icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{server.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(server.status)}
                          <span className="text-sm text-gray-500 capitalize">{server.status}</span>
                        </div>
                      </div>
                    </div>
                    <Switch checked={server.status === "active"} onCheckedChange={() => toggleServer(server.id)} />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-3">{server.description}</CardDescription>

                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Capabilities</div>
                      <div className="flex flex-wrap gap-1">
                        {server.capabilities.map((cap) => (
                          <Badge key={cap} variant="secondary" className="text-xs">
                            {cap}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {server.lastActivity && (
                      <div className="text-xs text-gray-500">Last activity: {server.lastActivity}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableToInstall.map((server) => (
              <Card key={server.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                      <server.icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{server.name}</CardTitle>
                      <Badge variant="outline" className="text-xs mt-1">
                        Not installed
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-3">{server.description}</CardDescription>

                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Capabilities</div>
                      <div className="flex flex-wrap gap-1">
                        {server.capabilities.map((cap) => (
                          <Badge key={cap} variant="secondary" className="text-xs">
                            {cap}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button onClick={() => installServer(server.id)} className="w-full" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Install Server
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Server Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">Gmail server accessed</div>
                    <div className="text-xs text-gray-500">Retrieved 5 latest emails • 2 minutes ago</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">File System operation</div>
                    <div className="text-xs text-gray-500">Read project files in /src directory • 30 seconds ago</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">Slack message sent</div>
                    <div className="text-xs text-gray-500">Posted update to #general channel • 5 minutes ago</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">Notion connection failed</div>
                    <div className="text-xs text-gray-500">Authentication error, check API key • 10 minutes ago</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-4 h-4 bg-gray-300 rounded-full" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">GitHub server disconnected</div>
                    <div className="text-xs text-gray-500">Manual disconnect by user • 1 hour ago</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}