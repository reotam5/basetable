import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
    Briefcase,
    Code,
    Copy,
    Edit,
    FileText,
    Mail,
    MessageSquare,
    Palette,
    Play,
    Plus,
    Star,
    Trash2,
} from "lucide-react"
import { useState } from "react"

interface Prompt {
  id: string
  name: string
  description: string
  content: string
  category: string
  icon: any
  isActive: boolean
  isFavorite: boolean
  usageCount: number
  lastUsed: string
}

const demoPrompts: Prompt[] = [
  {
    id: "1",
    name: "Professional Email Writer",
    description: "Helps compose professional, clear, and effective business emails",
    content:
      "You are a professional email writing assistant. Help users compose clear, concise, and professional emails. Always maintain a respectful tone and proper business etiquette. Structure emails with appropriate greetings, body, and closings.",
    category: "Communication",
    icon: Mail,
    isActive: true,
    isFavorite: true,
    usageCount: 47,
    lastUsed: "2 hours ago",
  },
  {
    id: "2",
    name: "Code Reviewer",
    description: "Reviews code for best practices, bugs, and improvements",
    content:
      "You are an expert code reviewer. Analyze code for:\n- Best practices and conventions\n- Potential bugs and security issues\n- Performance optimizations\n- Code readability and maintainability\n\nProvide constructive feedback with specific suggestions for improvement.",
    category: "Development",
    icon: Code,
    isActive: false,
    isFavorite: true,
    usageCount: 23,
    lastUsed: "1 day ago",
  },
  {
    id: "3",
    name: "Creative Assistant",
    description: "Helps with creative writing, brainstorming, and artistic projects",
    content:
      "You are a creative writing and brainstorming assistant. Help users with:\n- Story development and character creation\n- Creative problem solving\n- Artistic project ideas\n- Writing in various styles and genres\n\nBe imaginative, inspiring, and encourage creative thinking.",
    category: "Creative",
    icon: Palette,
    isActive: false,
    isFavorite: false,
    usageCount: 15,
    lastUsed: "3 days ago",
  },
  {
    id: "4",
    name: "Business Analyst",
    description: "Analyzes business problems and provides strategic insights",
    content:
      "You are a business analyst and strategic consultant. Help users with:\n- Market analysis and competitive research\n- Business process optimization\n- Strategic planning and decision making\n- Financial analysis and projections\n\nProvide data-driven insights and actionable recommendations.",
    category: "Business",
    icon: Briefcase,
    isActive: false,
    isFavorite: false,
    usageCount: 8,
    lastUsed: "1 week ago",
  },
  {
    id: "5",
    name: "Technical Documentation",
    description: "Creates clear and comprehensive technical documentation",
    content:
      "You are a technical documentation specialist. Help create:\n- API documentation and guides\n- User manuals and tutorials\n- Technical specifications\n- Process documentation\n\nWrite clearly, use proper formatting, and include relevant examples.",
    category: "Documentation",
    icon: FileText,
    isActive: false,
    isFavorite: false,
    usageCount: 12,
    lastUsed: "5 days ago",
  },
]

export function PromptManagement() {
  const [prompts, setPrompts] = useState<Prompt[]>(demoPrompts)
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showNewPrompt, setShowNewPrompt] = useState(false)

  const toggleActive = (id: string) => {
    setPrompts((prev) =>
      prev.map((prompt) => ({
        ...prompt,
        isActive: prompt.id === id ? !prompt.isActive : false,
      })),
    )
  }

  const toggleFavorite = (id: string) => {
    setPrompts((prev) =>
      prev.map((prompt) => (prompt.id === id ? { ...prompt, isFavorite: !prompt.isFavorite } : prompt)),
    )
  }

  const deletePrompt = (id: string) => {
    setPrompts((prev) => prev.filter((prompt) => prompt.id !== id))
    if (selectedPrompt?.id === id) {
      setSelectedPrompt(null)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      Communication: "bg-blue-100 text-blue-800",
      Development: "bg-green-100 text-green-800",
      Creative: "bg-purple-100 text-purple-800",
      Business: "bg-orange-100 text-orange-800",
      Documentation: "bg-gray-100 text-gray-800",
    }
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const favoritePrompts = prompts.filter((p) => p.isFavorite)
  const recentPrompts = prompts.sort((a, b) => b.usageCount - a.usageCount).slice(0, 3)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Prompt Management</h1>
          <p className="text-gray-600">Create and manage system prompts to customize AI behavior</p>
        </div>
        <Button onClick={() => setShowNewPrompt(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Prompt
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prompts List */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Prompts ({prompts.length})</TabsTrigger>
              <TabsTrigger value="favorites">Favorites ({favoritePrompts.length})</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3 mt-4">
              {prompts.map((prompt) => (
                <Card
                  key={prompt.id}
                  className={`cursor-pointer transition-all ${
                    selectedPrompt?.id === prompt.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:shadow-md"
                  } ${prompt.isActive ? "border-green-200 bg-green-50/30" : ""}`}
                  onClick={() => setSelectedPrompt(prompt)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <prompt.icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{prompt.name}</h3>
                            {prompt.isActive && <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>}
                            {prompt.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{prompt.description}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <Badge variant="secondary" className={getCategoryColor(prompt.category)}>
                              {prompt.category}
                            </Badge>
                            <span>Used {prompt.usageCount} times</span>
                            <span>Last used {prompt.lastUsed}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(prompt.id)
                          }}
                        >
                          <Star
                            className={`w-4 h-4 ${prompt.isFavorite ? "text-yellow-500 fill-current" : "text-gray-400"}`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleActive(prompt.id)
                          }}
                        >
                          <Play className={`w-4 h-4 ${prompt.isActive ? "text-green-500" : "text-gray-400"}`} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="favorites" className="space-y-3 mt-4">
              {favoritePrompts.map((prompt) => (
                <Card key={prompt.id} className="cursor-pointer hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <prompt.icon className="w-5 h-5 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{prompt.name}</h3>
                        <p className="text-sm text-gray-600">{prompt.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="recent" className="space-y-3 mt-4">
              {recentPrompts.map((prompt) => (
                <Card key={prompt.id} className="cursor-pointer hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <prompt.icon className="w-5 h-5 text-blue-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{prompt.name}</h3>
                          <p className="text-sm text-gray-600">Used {prompt.usageCount} times</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{prompt.lastUsed}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Prompt Editor */}
        <div className="space-y-4">
          {selectedPrompt ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <selectedPrompt.icon className="w-5 h-5" />
                    {selectedPrompt.name}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deletePrompt(selectedPrompt.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>{selectedPrompt.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Name</label>
                      <Input defaultValue={selectedPrompt.name} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                      <Input defaultValue={selectedPrompt.description} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Prompt Content</label>
                      <Textarea defaultValue={selectedPrompt.content} rows={8} className="font-mono text-sm" />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm">Save Changes</Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Prompt Content</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                          {selectedPrompt.content}
                        </pre>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-3 border-t">
                      <Badge className={getCategoryColor(selectedPrompt.category)}>{selectedPrompt.category}</Badge>
                      <span className="text-sm text-gray-500">{selectedPrompt.usageCount} uses</span>
                      <Button
                        size="sm"
                        onClick={() => toggleActive(selectedPrompt.id)}
                        variant={selectedPrompt.isActive ? "default" : "outline"}
                      >
                        {selectedPrompt.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Select a Prompt</h3>
                <p className="text-sm text-gray-500">Choose a prompt from the list to view and edit its content</p>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                Create from Template
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Copy className="w-4 h-4 mr-2" />
                Import Prompt
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Export All Prompts
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Prompt Modal */}
      {showNewPrompt && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle>Create New Prompt</CardTitle>
            <CardDescription>Define a new system prompt to customize AI behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Name</label>
                <Input placeholder="e.g., Marketing Assistant" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                <Input placeholder="e.g., Marketing" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
              <Input placeholder="Brief description of what this prompt does" />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Prompt Content</label>
              <Textarea placeholder="You are a helpful assistant that..." rows={6} className="font-mono text-sm" />
            </div>

            <div className="flex gap-3 pt-4">
              <Button>Create Prompt</Button>
              <Button variant="outline" onClick={() => setShowNewPrompt(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}