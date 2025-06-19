import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useChat } from "@/hooks/use-chat";
import { useChatInput } from "@/hooks/use-chat-input";
import { useParams } from "@tanstack/react-router";
import debounce from "lodash.debounce";
import { ArrowDown, Bot, Clock, Paperclip, Send, Server } from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatedText } from "./animated-text";
import { ChatInput } from "./chat-input";
import { DocumentCard } from "./document-card";
import { MessageContent } from "./message-content";

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
  search_results?: Array<{
    title: string;
    url: string;
  }>;
  longTextDocuments?: Array<{
    id: string;
    content: string;
    title: string;
  }>;
}

// Helper function to convert backend messages to UI messages
function backendToUIMessage(
  backendMsg: NonNullable<ReturnType<typeof useChat>["messages"]>[number]
): UIMessage {
  return {
    id: backendMsg?.id?.toString(),
    type: backendMsg?.type as "user" | "assistant" | "system",
    content: backendMsg?.content ?? "",
    timestamp: new Date(backendMsg.created_at!),
    status: backendMsg?.status as "success" | "pending" | "error",
    // These would be populated from  metadata
    agents: backendMsg?.metadata?.agents?.map(agent => agent.name) || null,
    mcpServers: undefined,
    systemPrompt: undefined,
    attachedFiles: undefined,
    search_results: backendMsg?.metadata?.search_results,
    longTextDocuments: backendMsg?.metadata?.longTextDocuments || [],
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
  const { chatId } = useParams({ from: '/__app_layout/chat/$chatId' });
  const { user } = useAuth();
  const { setSelectedTextContext } = useChatInput();
  const {
    chatTitle,
    newChatIds,
    messages: backendMessages,
    error,
    isLoading,
    isSending,
    isWaitingAI,
    sendMessage,
    isAgentResponding,
    cancel,
  } = useChat(Number(chatId));

  // Convert backend messages to UI messages
  const messages = useMemo(() =>
    backendMessages?.map(backendToUIMessage)?.filter((msg): msg is UIMessage => msg !== null),
    [backendMessages]
  );

  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [showLoading, setShowLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
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

  // Helper function to clean display content by removing context tags
  const cleanDisplayContent = useCallback((content: string) => {
    return content.replace(/<selected_context[^>]*>[\s\S]*?<\/selected_context>\s*/g, '').trim();
  }, []);

  // Handle text selection within messages
  const handleTextSelection = useCallback((messageId: string, messageType: 'user' | 'assistant' | 'system', timestamp: Date) => {
    setTimeout(() => { // Small delay to ensure selection is complete
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        const selectedText = selection.toString().trim();

        // Only capture meaningful selections (more than 3 characters)
        if (selectedText.length > 3) {
          const wordCount = selectedText.split(/\s+/).filter(word => word.length > 0).length;
          setSelectedTextContext({
            messageId,
            selectedText,
            wordCount,
            messageType,
            timestamp
          });
        }
      }
      // Don't clear context when no text is selected - let it persist until sent or manually cleared
    }, 10);
  }, [setSelectedTextContext]);

  // Don't auto-clear on deselection - let users keep context until they send or manually clear

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

  const handleSend = useCallback(async (data: { content: string; attachedFiles: File[]; longTextDocuments: Array<{ id: string, content: string, title: string }> }) => {
    const { content, attachedFiles, longTextDocuments } = data;
    if (isSending || (!content.trim() && !attachedFiles?.length && !longTextDocuments?.length)) return;

    try {
      await sendMessage({
        content,
        attachedFiles: data.attachedFiles,
        longTextDocuments: data.longTextDocuments,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Could add a toast notification here
    }
  }, [isSending, sendMessage]);

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
        // get last user message by checking for the background class
        const lastUserMessage = Array.from(messagesContainerRef.current.children)
          .reverse()
          .find(child => child.querySelector('.bg-neutral-100, .dark\\:bg-neutral-800')) as HTMLElement;

        if (!lastUserMessage) return;

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

  // Memoize the rendered messages to prevent unnecessary re-renders
  const filePreviews = useMemo(() => getFilePreviews(messages ?? []), [messages]);
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
      <div className="space-y-2" ref={messagesContainerRef}>
        {messages?.map((message) => (
          <div
            key={message.id}
            className="text-left"
          >
            <div className="w-full">
              <div
                className={`${message.type === "user"
                  ? "bg-neutral-100 dark:bg-neutral-800 py-3 px-4 text-foreground rounded-lg leading-relaxed inline-block max-w-full"
                  : "py-3 px-4 text-foreground leading-relaxed"
                  } cursor-text select-text`}
                onMouseUp={() => handleTextSelection(message.id, message.type, message.timestamp)}
                onKeyUp={() => handleTextSelection(message.id, message.type, message.timestamp)}
              >
                {message.type === "user" ? (
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar className="w-6 h-6 flex-shrink-0">
                      <AvatarImage src={user?.picture} alt={user?.name} />
                      <AvatarFallback className="text-xs">
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      {/** Pasted documents */}
                      {message.longTextDocuments && message.longTextDocuments.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                          {message.longTextDocuments.map((doc, index) => (
                            <div key={`doc-${index}`} className="flex-shrink-0 w-64">
                              <DocumentCard
                                content={doc.content}
                                title={doc.title}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap leading-relaxed text-left break-words">
                        {cleanDisplayContent(message.content)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <MessageContent
                    content={message.content ?? ""}
                    search_results={message.search_results}
                  />
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
                  message.status === "success"
                ) && (
                    <Fragment key={message.id}>
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
                                <span>{message.mcpServers.join(", ")}</span>
                              </div>
                            )}
                            {message.agents && (
                              <div className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300">
                                <Bot className="w-3 h-3" />
                                {message.agents.map((agent) => agent).join(", ")}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                              <Clock className="w-3 h-3" />
                              <span>{message.timestamp.toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </Fragment>
                  )}
              </div>
            </div>
          </div>
        ))}
        {isWaitingAI && (
          <div className="text-left">
            <div className="ml-3 py-2">
              <div className="typing-ellipsis">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }, [messages, isWaitingAI, user?.picture, user?.name, cleanDisplayContent, filePreviews, expandedMessages, handleTextSelection, toggleMessageExpansion]);

  return (
    <div className="flex-1 flex flex-col pt-[-5px] min-h-[calc(100vh-3.5rem-1px)]">
      {/* Chat Header */}
      <div className="sticky top-[57px] z-20 bg-gradient-to-b from-white via-white/80 to-transparent dark:from-neutral-950 dark:via-neutral-950/80 dark:to-transparent p-3">
        <div className="grid grid-cols-1 justify-items-center">
          <div className="w-full max-w-4xl px-3 grid">
            <h1 className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate col-span-1 min-w-0">
              {
                newChatIds.includes(Number(chatId)) ? (
                  <AnimatedText text={chatTitle!} />
                ) : (
                  chatTitle
                )
              }
            </h1>
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
          {!isLoading && !error && messages?.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No messages yet. Start a conversation!</p>
            </div>
          )}

          {!isLoading && !error && renderedMessages}
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
        <ChatInput
          containerClassName="max-w-4xl mx-auto"
          onSubmit={handleSend}
          placeholder="Ask anything 🤔"
          disabled={isSending || isWaitingAI || isAgentResponding}
          sendButtonContent={
            (isSending || isWaitingAI) ? (
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current"></div>
            ) : (
              <Send className="w-3.5 h-3.5" />
            )
          }
          showCancelButton={isAgentResponding}
          onCancel={cancel}
        />
      </div >
    </div >
  );
}