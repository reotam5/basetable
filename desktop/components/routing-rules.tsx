"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Plus, ArrowRight, Trash2, GripVertical, Zap, DollarSign, Clock, Brain } from "lucide-react"

interface RoutingRule {
  id: string
  name: string
  condition: string
  conditionType: "content" | "keyword" | "intent" | "user"
  conditionValue: string
  targetModel: string
  priority: number
  enabled: boolean
  cost: string
  speed: string
}

const demoRules: RoutingRule[] = [
  {
    id: "1",
    name: "Email Processing",
    condition: "content",
    conditionType: "intent",
    conditionValue: "email composition or analysis",
    targetModel: "Claude 3.5 Sonnet",
    priority: 1,
    enabled: true,
    cost: "$0.015/1K tokens",
    speed: "Fast",
  },
  {
    id: "2",
    name: "Code Generation",
    condition: "content",
    conditionType: "keyword",
    conditionValue: "code, programming, function, debug",
    targetModel: "Local Codestral",
    priority: 2,
    enabled: true,
    cost: "Free",
    speed: "Very Fast",
  },
  {
    id: "3",
    name: "Simple Questions",
    condition: "content",
    conditionType: "content",
    conditionValue: "short questions under 50 words",
    targetModel: "Local Llama 3.1",
    priority: 3,
    enabled: true,
    cost: "Free",
    speed: "Fast",
  },
  {
    id: "4",
    name: "Complex Analysis",
    condition: "content",
    conditionType: "content",
    conditionValue: "analysis, research, detailed explanation",
    targetModel: "GPT-4",
    priority: 4,
    enabled: true,
    cost: "$0.03/1K tokens",
    speed: "Medium",
  },
  {
    id: "5",
    name: "Creative Writing",
    condition: "content",
    conditionType: "keyword",
    conditionValue: "write, story, creative, poem",
    targetModel: "Claude 3.5 Sonnet",
    priority: 5,
    enabled: false,
    cost: "$0.015/1K tokens",
    speed: "Fast",
  },
]

export function RoutingRules() {
  const [rules, setRules] = useState<RoutingRule[]>(demoRules)
  const [showNewRule, setShowNewRule] = useState(false)

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule)))
  }

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((rule) => rule.id !== id))
  }

  const getModelIcon = (model: string) => {
    if (model.includes("Local")) return "🏠"
    if (model.includes("Claude")) return "🎭"
    if (model.includes("GPT")) return "🧠"
    return "🤖"
  }

  const getSpeedColor = (speed: string) => {
    switch (speed) {
      case "Very Fast":
        return "text-green-600 bg-green-50"
      case "Fast":
        return "text-blue-600 bg-blue-50"
      case "Medium":
        return "text-yellow-600 bg-yellow-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Routing Rules</h1>
          <p className="text-gray-600">Configure how requests are automatically routed to different AI models</p>
        </div>
        <Button onClick={() => setShowNewRule(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {/* Test Rules Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-500" />
            Test Routing Rules
          </CardTitle>
          <CardDescription>Enter a sample request to see which rule would be triggered</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input placeholder="e.g., 'Write a Python function to sort a list'" className="flex-1" />
            <Button>Test Route</Button>
          </div>
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-900">Predicted Route:</div>
            <div className="text-sm text-blue-700 mt-1">Code Generation rule → Local Codestral (Free, Very Fast)</div>
          </div>
        </CardContent>
      </Card>

      {/* Rules List */}
      <div className="space-y-3">
        {rules.map((rule, index) => (
          <Card
            key={rule.id}
            className={`${rule.enabled ? "border-blue-200 bg-blue-50/30" : "border-gray-200 bg-gray-50/30"}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm font-medium text-blue-600">
                    {index + 1}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                    <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-medium">IF</span>
                    <Badge variant="outline">{rule.conditionType}</Badge>
                    <span>contains</span>
                    <code className="px-2 py-1 bg-gray-100 rounded text-xs">{rule.conditionValue}</code>
                    <ArrowRight className="w-4 h-4 mx-2" />
                    <span className="font-medium">ROUTE TO</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {getModelIcon(rule.targetModel)} {rule.targetModel}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600">{rule.cost}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <Badge variant="secondary" className={`text-xs ${getSpeedColor(rule.speed)}`}>
                        {rule.speed}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRule(rule.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* New Rule Form */}
      {showNewRule && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle>Create New Routing Rule</CardTitle>
            <CardDescription>Define conditions and target model for automatic routing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Rule Name</label>
                <Input placeholder="e.g., Data Analysis" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Priority</label>
                <Input type="number" placeholder="1" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Condition Type</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keyword">Keywords</SelectItem>
                    <SelectItem value="intent">Intent Detection</SelectItem>
                    <SelectItem value="content">Content Analysis</SelectItem>
                    <SelectItem value="user">User-based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Condition Value</label>
                <Input placeholder="e.g., data, analysis, chart" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Target Model</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">🧠 GPT-4</SelectItem>
                    <SelectItem value="claude">🎭 Claude 3.5 Sonnet</SelectItem>
                    <SelectItem value="local-llama">🏠 Local Llama 3.1</SelectItem>
                    <SelectItem value="codestral">🏠 Local Codestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button>Create Rule</Button>
              <Button variant="outline" onClick={() => setShowNewRule(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Model Performance Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            Model Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">🧠 GPT-4</div>
              <div className="text-sm text-gray-600 mt-1">$0.03/1K • Medium Speed</div>
              <div className="text-xs text-gray-500 mt-2">Best for: Complex analysis</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">🎭 Claude</div>
              <div className="text-sm text-gray-600 mt-1">$0.015/1K • Fast</div>
              <div className="text-xs text-gray-500 mt-2">Best for: Writing, emails</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">🏠 Llama</div>
              <div className="text-sm text-gray-600 mt-1">Free • Fast</div>
              <div className="text-xs text-gray-500 mt-2">Best for: Simple queries</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">💻 Codestral</div>
              <div className="text-sm text-gray-600 mt-1">Free • Very Fast</div>
              <div className="text-xs text-gray-500 mt-2">Best for: Code generation</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
