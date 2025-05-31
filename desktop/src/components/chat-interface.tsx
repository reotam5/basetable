import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bot, Clock, Paperclip, Send, Server, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageContent } from "./message-content";
import { Textarea } from "./ui/textarea";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  agents?: string[];
  mcpServers?: string[];
  systemPrompt?: string;
  attachedFiles?: File[]; // Add attachedFiles to Message
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
    agents: ["Coding Assistant", "Email Assistant"],
    mcpServers: ["Gmail"],
    systemPrompt: "Professional Email Assistant",
  },
  {
    id: "3",
    type: "assistant",
    content:
      "Here's a summary of your 5 latest emails from today:\n\n1. **Project Update from Sarah** - Weekly status report on the Q4 launch, everything on track\n2. **Meeting Reminder** - Tomorrow's board meeting at 2 PM, agenda attached\n3. **Invoice from Acme Corp** - Monthly subscription renewal, $299\n4. **Team Lunch** - Friday team lunch at the new Italian place downtown\n5. **Security Alert** - Successful login from new device (your laptop)\n\nAll emails appear routine with no urgent action items.",
    timestamp: new Date(Date.now() - 280000),
    agents: ["Email Assistant"],
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
    agents: ["Coding Assistant"],
  },
  {
    id: "6",
    type: "assistant",
    content:
      'Here are two efficient approaches for calculating Fibonacci numbers:\n\n## Memoized Approach\n\n```python\ndef fibonacci(n, memo={}):\n    """Calculate fibonacci number efficiently using memoization"""\n    if n in memo:\n        return memo[n]\n    \n    if n <= 1:\n        return n\n    \n    memo[n] = fibonacci(n-1, memo) + fibonacci(n-2, memo)\n    return memo[n]\n```\n\n## Iterative Approach\n\n```python\ndef fibonacci_iterative(n):\n    """Calculate fibonacci number using iterative approach"""\n    if n <= 1:\n        return n\n    \n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    \n    return b\n```\n\n### Usage Examples\n\n```python\n# Example usage\nprint(fibonacci(10))  # Output: 55\nprint(fibonacci_iterative(10))  # Output: 55\n\n# Performance comparison\nimport time\n\nstart = time.time()\nresult1 = fibonacci(40)\ntime1 = time.time() - start\n\nstart = time.time()\nresult2 = fibonacci_iterative(40)\ntime2 = time.time() - start\n\nprint(f"Memoized: {result1} in {time1:.4f}s")\nprint(f"Iterative: {result2} in {time2:.4f}s")\n```\n\n**Performance Notes:**\n- The memoized version has **O(n)** time complexity and **O(n)** space complexity\n- The iterative version has **O(n)** time complexity and **O(1)** space complexity\n- For large values of n, the iterative approach is generally faster and more memory-efficient',
    timestamp: new Date(Date.now() - 100000),
    agents: ["Coding Assistant"],
  },
  {
    id: "7",
    type: "user",
    content: "Can you explain what React hooks are and show me some examples?",
    timestamp: new Date(Date.now() - 60000),
  },
  {
    id: "8",
    type: "assistant",
    content:
      "# React Hooks Overview\n\nReact Hooks are functions that let you **use state and other React features** without writing a class component. They were introduced in React 16.8.\n\n## Core Hooks\n\n### 1. useState Hook\nManages local component state:\n\n```jsx\nimport React, { useState } from 'react';\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  \n  return (\n    <div>\n      <p>You clicked {count} times</p>\n      <button onClick={() => setCount(count + 1)}>\n        Click me\n      </button>\n    </div>\n  );\n}\n```\n\n### 2. useEffect Hook\nHandles side effects like API calls, subscriptions, and DOM manipulation:\n\n```jsx\nimport React, { useState, useEffect } from 'react';\n\nfunction UserProfile({ userId }) {\n  const [user, setUser] = useState(null);\n  const [loading, setLoading] = useState(true);\n  \n  useEffect(() => {\n    async function fetchUser() {\n      setLoading(true);\n      try {\n        const response = await fetch(`/api/users/${userId}`);\n        const userData = await response.json();\n        setUser(userData);\n      } catch (error) {\n        console.error('Failed to fetch user:', error);\n      } finally {\n        setLoading(false);\n      }\n    }\n    \n    fetchUser();\n  }, [userId]); // Dependency array\n  \n  if (loading) return <div>Loading...</div>;\n  if (!user) return <div>User not found</div>;\n  \n  return (\n    <div>\n      <h2>{user.name}</h2>\n      <p>{user.email}</p>\n    </div>\n  );\n}\n```\n\n## Key Benefits\n\n- ✅ **Simpler code**: No need for class components\n- ✅ **Reusable logic**: Custom hooks can be shared between components\n- ✅ **Better performance**: Easier to optimize with React.memo and useMemo\n- ✅ **Easier testing**: Functional components are easier to test\n\n## Rules of Hooks\n\n> ⚠️ **Important**: Always follow these rules:\n\n1. **Only call hooks at the top level** - Don't call hooks inside loops, conditions, or nested functions\n2. **Only call hooks from React functions** - Don't call hooks from regular JavaScript functions\n\n### Custom Hook Example\n\n```jsx\n// Custom hook for handling form input\nfunction useInput(initialValue) {\n  const [value, setValue] = useState(initialValue);\n  \n  const handleChange = (e) => {\n    setValue(e.target.value);\n  };\n  \n  const reset = () => {\n    setValue(initialValue);\n  };\n  \n  return {\n    value,\n    onChange: handleChange,\n    reset\n  };\n}\n\n// Using the custom hook\nfunction LoginForm() {\n  const username = useInput('');\n  const password = useInput('');\n  \n  const handleSubmit = (e) => {\n    e.preventDefault();\n    console.log(username.value, password.value);\n    username.reset();\n    password.reset();\n  };\n  \n  return (\n    <form onSubmit={handleSubmit}>\n      <input\n        type=\"text\"\n        placeholder=\"Username\"\n        {...username}\n      />\n      <input\n        type=\"password\"\n        placeholder=\"Password\"\n        {...password}\n      />\n      <button type=\"submit\">Login</button>\n    </form>\n  );\n}\n```\n\nHooks make React development much more intuitive and powerful! 🚀",
    timestamp: new Date(Date.now() - 50000),
    agents: ["Coding Assistant"],
    attachedFiles: [
      new File([""], "react-hooks-overview.pdf", { type: "application/pdf" }),
      new File([""], "hooks-examples.js", { type: "text/javascript" }),
    ]
  },
];

// Helper to map attached files to preview objects (with image URLs if needed)
function getFilePreviews(messages: Message[]) {
  // Returns: { [messageId]: { name, type, url (for images), file }[] }
  const previews: Record<string, { name: string; type: string; url?: string; file: File }[]> = {};
  messages.forEach((msg) => {
    if (msg.attachedFiles && msg.attachedFiles.length > 0) {
      previews[msg.id] = msg.attachedFiles.map((file) => {
        if (file.type.startsWith("image/")) {
          return { name: file.name, type: file.type, url: URL.createObjectURL(file), file };
        }
        return { name: file.name, type: file.type, file };
      });
    }
  });
  return previews;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(demoMessages);
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4");
  const [isTyping, setIsTyping] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [showCharacterError, setShowCharacterError] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialLoad = useRef(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "instant"
    });
  }, []);

  useEffect(() => {
    if (isInitialLoad.current) {
      // On initial load, scroll without animation
      scrollToBottom(false);
      isInitialLoad.current = false;
    } else {
      // On subsequent updates, scroll with animation
      scrollToBottom(true);
    }
  }, [messages, isTyping, scrollToBottom]);

  const toggleMessageExpansion = useCallback((messageId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  }, []);

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isTyping) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
      attachedFiles: attachedFiles.length > 0 ? attachedFiles : undefined, // Attach files
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    setAttachedFiles([]); // Clear attached files after sending
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content:
          "This is a demo response. In a real implementation, this would be processed by your selected model and routing rules.",
        timestamp: new Date(),
        agents: ["Email Assistant", "Coding Assistant"],
        mcpServers: ["Gmail"],
      };
      setMessages((prev) => [...prev, response]);
      setIsTyping(false);
    }, 2000);
  }, [inputValue, isTyping, attachedFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length > 2000) {
      setShowCharacterError(true);
      setTimeout(() => setShowCharacterError(false), 3000); // Hide error after 3 seconds
      return;
    }
    setShowCharacterError(false);
    setInputValue(value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isTyping) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend, isTyping]);

  const handleModelChange = useCallback((value: string) => {
    setSelectedModel(value);
  }, []);

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
      e.target.value = ""; // reset for re-uploading same file
    }
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Memoize the rendered messages to prevent unnecessary re-renders
  const filePreviews = useMemo(() => getFilePreviews(messages), [messages]);
  useEffect(() => {
    // Cleanup image URLs on unmount or messages change
    return () => {
      Object.values(filePreviews).flat().forEach((preview) => {
        if (preview.url) URL.revokeObjectURL(preview.url);
      });
    };
  }, [filePreviews]);

  const renderedMessages = useMemo(() => {
    return messages.map((message) => (
      <div
        key={message.id}
        className={`${message.type === "user" ? "text-right" : "text-left"}`}
      >
        <div className="inline-block">
          <div
            className={`${message.type === "user"
              ? "bg-primary p-3 text-primary-foreground rounded-sm max-w-2xl"
              : "bg-secondary p-3 text-secondary-foreground rounded-sm"
              }`}
          >
            {message.type === "user" ? (
              <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
            ) : (
              <MessageContent content={message.content} />
            )}

            {/* Show attached files if present */}
            {filePreviews[message.id] && filePreviews[message.id].length > 0 && (
              <div className="mt-3 flex flex-col">
                {/* Image attachments */}
                <div className="flex flex-wrap gap-2">
                  {
                    filePreviews[message.id].filter(preview => preview.type.startsWith("image/")).map(preview => (
                      <img src={preview.url} alt={preview.name} className="max-w-[120px] max-h-[80px] rounded mb-1" />
                    ))
                  }
                </div>
                {filePreviews[message.id].some(preview => !preview.type.startsWith("image/")) && filePreviews[message.id].some(preview => preview.type.startsWith("image/")) && (
                  <div className="mb-2"></div>
                )}
                {/* File attachments */}
                <div className="flex flex-wrap gap-2">
                  {filePreviews[message.id].filter(preview => !preview.type.startsWith("image/")).map((preview, idx) => (
                    <div
                      key={preview.name + preview.file.size + idx}
                      className={`flex items-center px-3 py-1 text-sm rounded-sm border ${message.type === "user" ? "border-neutral-500 dark:border-neutral-300" : "border-neutral-300 dark:border-neutral-500"}`}
                    >
                      <Paperclip className="w-4 h-4 mr-1 opacity-70" />
                      <span className="truncate max-w-[120px]" title={preview.name}>{preview.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(message.type === "assistant" &&
              (message.mcpServers ||
                message.agents)) && (
                <>
                  <div className="mt-3 pt-3">
                    <button
                      onClick={() => toggleMessageExpansion(message.id)}
                      className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-400 transition-colors"
                    >
                      <div className={`transform transition-transform ${expandedMessages.has(message.id) ? 'rotate-90' : 'rotate-0'}`}>
                        ▶
                      </div>
                      {expandedMessages.has(message.id) ? "Hide details" : "Show details"}
                    </button>

                    {expandedMessages.has(message.id) && (
                      <div className="mt-3 space-y-2 pl-1">
                        {message.mcpServers && (
                          <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                            <Server className="w-3 h-3" />
                            <span className="font-medium">Accessed:</span>
                            <span>{message.mcpServers.join(", ")}</span>
                          </div>
                        )}
                        {message.agents && (
                          <div className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300">
                            <Bot className="w-3 h-3" />
                            <span className="font-medium">Agents:</span>
                            {message.agents.map((agent, idx) => (
                              <span key={idx}>{agent}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                          <Clock className="w-3 h-3" />
                          <span className="font-medium">Time:</span>
                          <span>{message.timestamp.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
          </div>
        </div>
      </div>
    ));
  }, [messages, expandedMessages, toggleMessageExpansion, filePreviews]);

  return (
    <div className="flex-1 flex flex-col pt-[-5px] min-h-[calc(100vh-3.5rem-1px)]">
      {/* Chat Header */}
      <div className="sticky top-[57px] z-20 bg-gradient-to-b from-white via-white/80 to-transparent dark:from-neutral-950 dark:via-neutral-950/80 dark:to-transparent p-3">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-lg font-medium text-gray-900 dark:text-gray-100">Email Summary & Code</h1>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        <div className="flex-1"></div>
        <div className="max-w-4xl mx-auto px-3 py-8 space-y-6" style={{ width: "-webkit-fill-available" }}>
          {renderedMessages}

          {isTyping && (
            <div className="text-left">
              <div className="flex gap-1 ml-3">
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 p-4">
        <div className="max-w-4xl mx-auto">

          <div className="bg-white dark:bg-neutral-800 rounded-sm  border border-neutral-200 dark:border-neutral-500">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Reply to basetable..."
              rows={5}
              className="w-full p-4 resize-none leading-relaxed  focus-visible:ring-transparent border-0 shadow-none min-h-[3rem] max-h-[12rem]"
            />
            <div className="flex justify-between items-end p-3" onClick={(e) => { textareaRef.current?.focus(); e.stopPropagation(); }}>
              {/* Bottom Left Controls */}
              <div>
                {/* Attached Files Preview */}
                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {attachedFiles.map((file, idx) => (
                      <div
                        key={file.name + file.size + idx}
                        className="flex items-center border border-neutral-200 dark:border-neutral-500 rounded px-3 py-1 text-sm text-neutral-800 dark:text-neutral-200"
                      >
                        <Paperclip className="w-4 h-4 mr-1 opacity-70" />
                        <span className="truncate max-w-[120px]" title={file.name}>{file.name}</span>
                        <button
                          className="ml-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 focus:outline-none"
                          onClick={() => handleRemoveFile(idx)}
                          aria-label="Remove file"
                          type="button"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Error message for character limit */}
                {showCharacterError && (
                  <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded">
                    Maximum 2000 characters allowed
                  </div>
                )}
              </div>
              {/* Bottom Right Controls */}
              <div className="flex items-center">
                {/* Model Selector */}
                <Select value={selectedModel} onValueChange={handleModelChange}>
                  <SelectTrigger className="w-36 h-8 text-xs border-0 shadow-none ring-sidebar-accent hover:ring-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">🧠 GPT-4</SelectItem>
                    <SelectItem value="claude">🎭 Claude 3.5 Sonnet</SelectItem>
                    <SelectItem value="local-llama">🦙 Local Llama</SelectItem>
                    <SelectItem value="codestral">💻 Local Codestral</SelectItem>
                  </SelectContent>
                </Select>
                <div>
                  {/* Attach File Button (bottom left) */}
                  <button
                    type="button"
                    className="flex items-center justify-center w-8 h-8 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                    onClick={handleAttachClick}
                    aria-label="Attach file"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    aria-label="File input"
                  />
                </div>
                {/* Send Button */}
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isTyping}
                  size="icon"
                  variant="ghost"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}