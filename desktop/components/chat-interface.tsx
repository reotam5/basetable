"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Bot, User, Server, Clock, Zap, Search } from "lucide-react";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  model?: string;
  mcpServers?: string[];
  routing?: string;
  systemPrompt?: string;
}

const demoMessages: Message[] = [
  {
    id: "1",
    type: "user",
    content: "Can you summarize my latest emails from today?",
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: "2",
    type: "assistant",
    content:
      "I'll access your Gmail to get your latest emails and provide a summary.",
    timestamp: new Date(Date.now() - 290000),
    model: "Claude 3.5 Sonnet",
    mcpServers: ["Gmail"],
    routing: "Auto-routed to Claude for email processing",
    systemPrompt: "Professional Email Assistant",
  },
  {
    id: "3",
    type: "assistant",
    content:
      "Here's a summary of your 5 latest emails from today:\n\n1. **Project Update from Sarah** - Weekly status report on the Q4 launch, everything on track\n2. **Meeting Reminder** - Tomorrow's board meeting at 2 PM, agenda attached\n3. **Invoice from Acme Corp** - Monthly subscription renewal, $299\n4. **Team Lunch** - Friday team lunch at the new Italian place downtown\n5. **Security Alert** - Successful login from new device (your laptop)\n\nAll emails appear routine with no urgent action items.",
    timestamp: new Date(Date.now() - 280000),
    model: "Claude 3.5 Sonnet",
    mcpServers: ["Gmail"],
  },
  {
    id: "4",
    type: "user",
    content:
      "Write a Python function to calculate fibonacci numbers efficiently",
    timestamp: new Date(Date.now() - 120000),
  },
  {
    id: "5",
    type: "assistant",
    content:
      "I'll route this coding question to our local Codestral model for optimal performance.",
    timestamp: new Date(Date.now() - 110000),
    routing: "Auto-routed to Local Codestral for coding tasks",
  },
  {
    id: "6",
    type: "assistant",
    content:
      '```python\ndef fibonacci(n, memo={}):\n    """Calculate fibonacci number efficiently using memoization"""\n    if n in memo:\n        return memo[n]\n    \n    if n <= 1:\n        return n\n    \n    memo[n] = fibonacci(n-1, memo) + fibonacci(n-2, memo)\n    return memo[n]\n\n# Alternative iterative approach for even better performance\ndef fibonacci_iterative(n):\n    """Calculate fibonacci number using iterative approach"""\n    if n <= 1:\n        return n\n    \n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    \n    return b\n\n# Example usage\nprint(fibonacci(10))  # Output: 55\nprint(fibonacci_iterative(10))  # Output: 55\n```\n\nThe memoized version has O(n) time complexity and the iterative version uses O(1) space.',
    timestamp: new Date(Date.now() - 100000),
    model: "Local Codestral",
  },
];

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(demoMessages);
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState("auto");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content:
          "This is a demo response. In a real implementation, this would be processed by your selected model and routing rules.",
        timestamp: new Date(),
        model: selectedModel === "auto" ? "GPT-4" : selectedModel,
        routing:
          selectedModel === "auto"
            ? "Auto-routed based on content type"
            : undefined,
      };
      setMessages((prev) => [...prev, response]);
      setIsTyping(false);
    }, 2000);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] w-full gap-6">
      {/* Chat History Sidebar */}
      <div className="w-64 flex-shrink-0 bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations, servers, prompts..."
              className="pl-10 pr-4 py-2 w-50 60 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Conversations</h3>
          <Button size="sm" variant="outline">
            New Chat
          </Button>
        </div>
        <div className="space-y-2">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer">
            <div className="font-medium text-sm text-gray-900">
              Email Summary & Code
            </div>
            <div className="text-xs text-gray-500 mt-1">5 minutes ago</div>
          </div>
          <div className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
            <div className="font-medium text-sm text-gray-900">
              Project Planning
            </div>
            <div className="text-xs text-gray-500 mt-1">2 hours ago</div>
          </div>
          <div className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
            <div className="font-medium text-sm text-gray-900">
              Data Analysis Help
            </div>
            <div className="text-xs text-gray-500 mt-1">Yesterday</div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col">
        {/* Chat Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">AI Chat</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  Professional Email Assistant
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Auto-routing enabled
                </Badge>
              </div>
            </div>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">🤖 Auto-route</SelectItem>
                <SelectItem value="gpt-4">🧠 GPT-4</SelectItem>
                <SelectItem value="claude">🎭 Claude 3.5 Sonnet</SelectItem>
                <SelectItem value="local-llama">🦙 Local Llama</SelectItem>
                <SelectItem value="codestral">💻 Local Codestral</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.type === "assistant" && (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div
                className={`max-w-2xl ${message.type === "user" ? "order-first" : ""}`}
              >
                <Card
                  className={`p-4 ${message.type === "user" ? "bg-blue-500 text-white" : "bg-gray-50"}`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>

                  {message.type === "assistant" &&
                    (message.mcpServers ||
                      message.routing ||
                      message.model) && (
                      <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                        {message.routing && (
                          <div className="flex items-center gap-2 text-xs text-blue-600">
                            <Zap className="w-3 h-3" />
                            {message.routing}
                          </div>
                        )}
                        {message.mcpServers && (
                          <div className="flex items-center gap-2 text-xs text-green-600">
                            <Server className="w-3 h-3" />
                            Accessed: {message.mcpServers.join(", ")}
                          </div>
                        )}
                        {message.model && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Bot className="w-3 h-3" />
                            Model: {message.model}
                          </div>
                        )}
                      </div>
                    )}
                </Card>

                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>

              {message.type === "user" && (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <Card className="p-4 bg-gray-50">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask anything... Arx will route to the best model and access needed services"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button onClick={handleSend} disabled={!inputValue.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
