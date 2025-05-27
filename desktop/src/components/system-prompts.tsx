import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Eye, Globe, RotateCcw, Save, Settings, Shield, User, Zap } from "lucide-react"
import { useState } from "react"

const systemPromptTemplate = `You are Arx, an intelligent AI control center assistant. You help users manage their AI workflows, MCP servers, and routing decisions.

Core Personality:
- Professional yet approachable
- Technically knowledgeable about AI systems
- Focused on efficiency and optimization
- Proactive in suggesting improvements

Key Capabilities:
- Route requests to appropriate AI models based on content type and user preferences
- Access and coordinate multiple MCP servers (Gmail, Slack, GitHub, File System, etc.)
- Provide insights on usage patterns and cost optimization
- Help users configure and manage their AI infrastructure

Communication Style:
- Clear and concise explanations
- Use technical terms when appropriate but explain complex concepts
- Provide actionable recommendations
- Show transparency in routing decisions and MCP server access

Context Awareness:
- Remember user preferences and past interactions
- Consider cost implications when routing requests
- Prioritize local models when possible for privacy and cost efficiency
- Suggest relevant MCP servers based on request context

Always explain your reasoning when making routing decisions or accessing MCP servers.`

export function SystemPrompts() {
  const [systemPrompt, setSystemPrompt] = useState(systemPromptTemplate)
  const [hasChanges, setHasChanges] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const handlePromptChange = (value: string) => {
    setSystemPrompt(value)
    setHasChanges(value !== systemPromptTemplate)
  }

  const savePrompt = () => {
    // Save logic here
    setHasChanges(false)
  }

  const resetPrompt = () => {
    setSystemPrompt(systemPromptTemplate)
    setHasChanges(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">System Prompts</h1>
          <p className="text-gray-600">Configure the core AI behavior and personality for Arx</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              Unsaved Changes
            </Badge>
          )}
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="w-4 h-4 mr-2" />
            {previewMode ? "Edit" : "Preview"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Core System Prompt
              </CardTitle>
              <CardDescription>
                This prompt defines Arx's personality, capabilities, and behavior patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewMode ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">{systemPrompt}</pre>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setPreviewMode(false)}>Edit Prompt</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Textarea
                    value={systemPrompt}
                    onChange={(e) => handlePromptChange(e.target.value)}
                    rows={20}
                    className="font-mono text-sm"
                    placeholder="Enter your system prompt here..."
                  />
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {systemPrompt.length} characters • {Math.ceil(systemPrompt.length / 4)} tokens (approx)
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={resetPrompt} disabled={!hasChanges}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                      </Button>
                      <Button onClick={savePrompt} disabled={!hasChanges}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Prompt Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dynamic Variables</CardTitle>
              <CardDescription>Available variables for your system prompt</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                  <code className="text-sm font-mono text-blue-800">{"{{user_name}}"}</code>
                  <div className="text-xs text-blue-600 mt-1">Current user's name</div>
                </div>
                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                  <code className="text-sm font-mono text-blue-800">{"{{current_time}}"}</code>
                  <div className="text-xs text-blue-600 mt-1">Current date and time</div>
                </div>
                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                  <code className="text-sm font-mono text-blue-800">{"{{active_servers}}"}</code>
                  <div className="text-xs text-blue-600 mt-1">List of active MCP servers</div>
                </div>
                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                  <code className="text-sm font-mono text-blue-800">{"{{user_preferences}}"}</code>
                  <div className="text-xs text-blue-600 mt-1">User's saved preferences</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prompt Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <User className="w-4 h-4 mr-2" />
                Personal Assistant
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Globe className="w-4 h-4 mr-2" />
                Business Professional
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Shield className="w-4 h-4 mr-2" />
                Security Focused
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Zap className="w-4 h-4 mr-2" />
                Performance Optimized
              </Button>
            </CardContent>
          </Card>

          {/* Prompt Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Best Practices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <div>
                  <div className="font-medium text-gray-900 mb-1">Be Specific</div>
                  <div>Define clear roles and capabilities</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900 mb-1">Set Boundaries</div>
                  <div>Specify what the AI should and shouldn't do</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900 mb-1">Include Context</div>
                  <div>Provide relevant background information</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900 mb-1">Test Thoroughly</div>
                  <div>Validate behavior with various inputs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Advanced Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Configuration</CardTitle>
          <CardDescription>Fine-tune system behavior and integration settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="behavior" className="space-y-4">
            <TabsList>
              <TabsTrigger value="behavior">Behavior Settings</TabsTrigger>
              <TabsTrigger value="routing">Routing Preferences</TabsTrigger>
              <TabsTrigger value="security">Security & Privacy</TabsTrigger>
            </TabsList>

            <TabsContent value="behavior" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Response Style</label>
                  <select className="w-full p-2 border border-gray-200 rounded-lg">
                    <option>Professional</option>
                    <option>Casual</option>
                    <option>Technical</option>
                    <option>Friendly</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Verbosity Level</label>
                  <select className="w-full p-2 border border-gray-200 rounded-lg">
                    <option>Concise</option>
                    <option>Balanced</option>
                    <option>Detailed</option>
                    <option>Comprehensive</option>
                  </select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="routing" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Default Model Preference</label>
                  <select className="w-full p-2 border border-gray-200 rounded-lg">
                    <option>Auto-route (Recommended)</option>
                    <option>Prefer Local Models</option>
                    <option>Prefer Cloud Models</option>
                    <option>Cost Optimized</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Routing Transparency</label>
                  <select className="w-full p-2 border border-gray-200 rounded-lg">
                    <option>Always Show</option>
                    <option>Show on Request</option>
                    <option>Hide Details</option>
                  </select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Data Retention</div>
                    <div className="text-sm text-gray-600">How long to keep conversation history</div>
                  </div>
                  <select className="p-2 border border-gray-200 rounded-lg">
                    <option>30 days</option>
                    <option>90 days</option>
                    <option>1 year</option>
                    <option>Forever</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Sensitive Data Handling</div>
                    <div className="text-sm text-gray-600">How to handle potentially sensitive information</div>
                  </div>
                  <select className="p-2 border border-gray-200 rounded-lg">
                    <option>Auto-detect and mask</option>
                    <option>Warn before processing</option>
                    <option>No special handling</option>
                  </select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}