import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { use } from "@/hooks/use";
import { Message as BackendMessage, useChat } from "@/hooks/use-chat";
import { useParams } from "@tanstack/react-router";
import debounce from "lodash.debounce";
import { ArrowDown, Bot, Clock, Paperclip, Send, Server, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageContent } from "./message-content";
import { Textarea } from "./ui/textarea";

// UI message interface for display
interface UIMessage {
  id: string;
  type: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  status: "success" | "pending" | "error";
  agents?: string[];
  mcpServers?: string[];
  systemPrompt?: string;
  attachedFiles?: File[];
}

// Helper function to convert backend messages to UI messages
function backendToUIMessage(backendMsg: BackendMessage): UIMessage {
  return {
    id: backendMsg?.id?.toString(),
    type: backendMsg?.type,
    content: backendMsg?.content ?? "",
    timestamp: new Date(backendMsg?.createdAt),
    status: backendMsg?.status,
    // These would be populated from additional API calls or metadata
    agents: undefined,
    mcpServers: undefined,
    systemPrompt: undefined,
    attachedFiles: undefined,
  };
}

// Helper to map attached files to preview objects (with image URLs if needed)
function getFilePreviews(messages: UIMessage[]) {
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
  const { chatId } = useParams({ from: '/chat/$chatId' });
  const llmsFetcher = useCallback(async () => await window.electronAPI.llm.getAll(), []);
  const { data: llms } = use({ fetcher: llmsFetcher });
  const {
    chatTitle,
    messages: backendMessages,
    selectedLLM,
    setSelectedLLM,
    error,
    isLoading,
    isSending,
    sendMessage,
    isAgentResponding,
    cancel,
  } = useChat(Number(chatId));

  // Convert backend messages to UI messages
  const messages = useMemo(() =>
    backendMessages?.map(backendToUIMessage)?.filter((msg): msg is UIMessage => msg !== null),
    [backendMessages]
  );

  const [inputValue, setInputValue] = useState("");
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [showCharacterError, setShowCharacterError] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [showLoading, setShowLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialLoad = useRef(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previousMessageCount = useRef(0);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottomButton, setShowScrollToBottomButton] = useState(false);

  const scrollToBottom = useMemo(() => debounce((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "instant"
    });
  }, 10, { leading: true, trailing: false }), []);

  // Reset initial load flag when chatId changes
  useEffect(() => {
    isInitialLoad.current = true;
    previousMessageCount.current = 0;
    setShowLoading(false); // Clear loading state when switching chats

    // Clear any pending loading timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  }, [chatId]);

  // Handle delayed loading state - only show loading after 500ms
  useEffect(() => {
    if (isLoading) {
      // Clear any existing timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      // Set timeout to show loading after 500ms
      loadingTimeoutRef.current = setTimeout(() => {
        setShowLoading(true);
      }, 500);
    } else {
      // Clear timeout and hide loading immediately when not loading
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      setShowLoading(false);
    }

    // Cleanup timeout on unmount
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [isLoading]);

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

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isSending) return;

    const content = inputValue.trim();
    setInputValue("");
    setAttachedFiles([]); // Clear attached files after sending

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      await sendMessage({
        content,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Could add a toast notification here
    }
  }, [inputValue, isSending, sendMessage]);

  // when chat is opened, it should start at the bottom.
  const instantScrollDown = useRef(true);
  useEffect(() => () => { instantScrollDown.current = true }, [chatId]);
  useEffect(() => {
    if (!instantScrollDown.current || !messages?.length) return;
    scrollToBottom(false);
    instantScrollDown.current = false;
  }, [chatId, scrollToBottom, messages]);

  useEffect(() => {
    // after sending a message (it has isSending = false back again after sending)
    if (!isSending && !instantScrollDown.current) {
      if (messagesContainerRef.current) {
        // get last children that has the class "text-right" (user message)
        const lastUserMessage = Array.from(messagesContainerRef.current.children)
          .reverse()
          .find(child => child.classList.contains("text-right")) as HTMLElement;
        const currentMessageContainerHeight = messagesContainerRef.current.getBoundingClientRect().height;
        const lastUserMessagePosition = lastUserMessage.offsetTop;
        const remainingHeight = currentMessageContainerHeight - lastUserMessagePosition;

        messagesContainerRef.current.style.minHeight = currentMessageContainerHeight + (window.innerHeight - 460 - remainingHeight) + 'px';
        scrollToBottom(true);
      }
    }
  }, [isSending, scrollToBottom]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setShowScrollToBottomButton(false);
        } else {
          if (isSending) return;
          setShowScrollToBottomButton(true);
        }
      });
    })
    if (messagesEndRef.current) {
      observer.observe(messagesEndRef.current);
    }
    return () => {
      if (messagesEndRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        observer.unobserve(messagesEndRef.current);
      }
    }
  }, [isSending])

  // stick scroll at bottom as ai response is being generated
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach(() => {
        if (!showScrollToBottomButton && !instantScrollDown.current && isAgentResponding) {
          scrollToBottom(true);
        }
      })
    });
    if (messagesContainerRef.current) {
      resizeObserver.observe(messagesContainerRef.current);
    }
    return () => {
      if (messagesContainerRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        resizeObserver.unobserve(messagesContainerRef.current);
      }
    }
  }, [isAgentResponding, scrollToBottom, showScrollToBottomButton])

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
    if (e.key === "Enter" && !e.shiftKey && !isSending) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend, isSending]);


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
    return (
      <div className="space-y-6" ref={messagesContainerRef}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${message.type === "user" ? "text-right" : "text-left"}`}
          >
            <div className="inline-block">
              <div
                className={`${message.type === "user"
                  ? "bg-primary py-[6px] px-3 text-primary-foreground rounded-sm max-w-2xl"
                  : "bg-secondary py-[6px] px-3 text-secondary-foreground rounded-sm"
                  }`}
              >
                {message.type === "user" ? (
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </div>
                ) : (
                  <MessageContent content={message.content ?? ""} />
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
        ))}
      </div>
    );
  }, [messages, expandedMessages, toggleMessageExpansion, filePreviews]);

  return (
    <div className="flex-1 flex flex-col pt-[-5px] min-h-[calc(100vh-3.5rem-1px)]">
      {/* Chat Header */}
      <div className="sticky top-[57px] z-20 bg-gradient-to-b from-white via-white/80 to-transparent dark:from-neutral-950 dark:via-neutral-950/80 dark:to-transparent p-3">
        <div className="grid grid-cols-1 justify-items-center">
          <div className="w-full max-w-4xl px-3 grid">
            <h1 className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate col-span-1 min-w-0">{chatTitle}</h1>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        <div className="max-w-4xl mx-auto px-3 py-8 space-y-6" style={{ width: "-webkit-fill-available" }}>
          {/* Loading state */}
          {showLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading messages...</p>
            </div>
          )}

          {/* Messages */}
          {!isLoading && !error && messages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No messages yet. Start a conversation!</p>
            </div>
          )}

          {!isLoading && !error && renderedMessages}

          {isSending && (
            <div className="text-left">
              <div className="flex gap-1 ml-3">
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef}></div>
        </div>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 p-4">
        {
          showScrollToBottomButton && (
            <Button
              onClick={() => scrollToBottom(true)}
              className="absolute top-[-30px] right-[calc(50%-24px)] rounded-full"
              variant="outline"
              size="icon"
            >
              <ArrowDown />
            </Button>
          )
        }
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
                <Select value={selectedLLM?.toString()} onValueChange={(llmId) => setSelectedLLM(parseInt(llmId))}>
                  <SelectTrigger className="w-36 h-8 text-xs border-0 shadow-none ring-sidebar-accent hover:ring-1">
                    <SelectValue />
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
                            <SelectItem key={llm.id} value={llm.id.toString()}>
                              {llm.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ));
                    })()}
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
                {
                  isAgentResponding ? (
                    <Button
                      onClick={cancel}
                      size="icon"
                      variant="ghost"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSend}
                      disabled={!inputValue.trim() || isSending}
                      size="icon"
                      variant="ghost"
                    >
                      {isSending ? (
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current"></div>
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  )
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}