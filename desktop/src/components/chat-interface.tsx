import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/use-chat";
import { useChatInput } from "@/hooks/use-chat-input";
import { useParams } from "@tanstack/react-router";
import debounce from "lodash.debounce";
import { ArrowDown, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatedText } from "./animated-text";
import { AssistantMessage } from "./assistant-message";
import { ChatInput } from "./chat-input";
import { UserMessage } from "./user-message";


export type UIMessage = ReturnType<typeof useChat>['messages'][number]

export function ChatInterface() {
  const { chatId } = useParams({ from: '/__app_layout/chat/$chatId' });
  const { setSelectedTextContext } = useChatInput();
  const {
    chatTitle,
    newChatIds,
    messages,
    error,
    isLoading,
    isSending,
    isWaitingAI,
    sendMessage,
    isAgentResponding,
    cancel,
    sendToolCallConfirmation,
    streamError,
    restartFromLastUserMessage
  } = useChat(Number(chatId));
  const [mcpToolKey, setMcpToolKey] = useState(-1);
  const [showLoading, setShowLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const previousMessageCount = useRef(0);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesContainerWrapperRef = useRef<HTMLDivElement>(null);
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


  // Handle text selection within messages
  const handleTextSelection = useCallback((messageId: number, messageType: UIMessage['message']['role'] | 'tool', timestamp: Date) => {
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


  const handleSend = useCallback(async (data: { content: string; attachedFiles: File[]; longTextDocuments: Array<{ id: string, content: string, title: string }> }) => {
    const { content, attachedFiles, longTextDocuments } = data;
    if (isSending || (!content.trim() && !attachedFiles?.length && !longTextDocuments?.length)) return;

    try {
      await sendMessage({
        message: content.trim(),
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
      if (messagesContainerRef.current && messagesContainerWrapperRef.current) {
        // get last user message by checking for the background class
        const lastUserMessage = Array.from(messagesContainerRef.current.children)
          .reverse()
          .find(child => child.querySelector('.user-message')) as HTMLElement;

        if (!lastUserMessage) return;

        const actualHeightMessagesTakes = messagesContainerRef.current.getBoundingClientRect().height;
        const lastUserMessageHeight = lastUserMessage.getBoundingClientRect().height;


        messagesContainerWrapperRef.current.style.minHeight = actualHeightMessagesTakes + (window.innerHeight - lastUserMessageHeight) - 370 + 'px';
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


          {!isLoading && !error && (
            <div ref={messagesContainerWrapperRef}>
              <div ref={messagesContainerRef} className="space-y-2">
                {messages?.map(({ message, toolCalls }) => (
                  <div
                    key={message.id + (toolCalls?.length ?? 0)}
                    className="text-left"
                  >
                    <div className="w-full">
                      <div
                        className={`${message.role === "user"
                          ? "bg-neutral-100 dark:bg-neutral-800 py-3 px-4 text-foreground rounded-lg leading-relaxed inline-block max-w-full"
                          : "py-3 px-4 text-foreground leading-relaxed"
                          } cursor-text select-text`}
                        onMouseUp={() => handleTextSelection(message.id, message.role, message.created_at!)}
                        onKeyUp={() => handleTextSelection(message.id, message.role, message.created_at!)}
                      >
                        {message.role === "user" ? (
                          <UserMessage message={message} />
                        ) : message.role === "assistant" ? (
                          <AssistantMessage message={message} toolCalls={toolCalls} sendToolCallConfirmation={sendToolCallConfirmation} mcpToolKey={mcpToolKey} setMcpToolKey={setMcpToolKey} />
                        ) : (
                          <div>Unknown message type: {JSON.stringify(message, null, 2)}</div>
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
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center min-h-[calc(100vh-500px)]">
              <div className="max-w-md w-full mx-auto">
                <div className="bg-card border border-destructive/20 rounded-lg p-8 text-center">
                  {/* Error Icon */}
                  <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
                    <svg
                      className="w-8 h-8 text-destructive"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>

                  {/* Error Title */}
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Something went wrong
                  </h3>

                  {/* Error Message */}
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    {error.message || 'We encountered an unexpected error while loading your messages. This might be a temporary issue.'}
                  </p>

                  {/* Additional Help */}
                  <div className="mt-6 pt-6 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                      If this problem persists, try restarting the application or contact support.
                    </p>
                  </div>
                </div>
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
        {
          streamError && (
            <div className="max-w-4xl mx-auto mb-4 bg-background">
              <div className="bg-destructive/10 border border-destructive rounded-lg p-4 flex items-start gap-3">
                {/* Error Icon */}
                <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                  <svg
                    className="w-5 h-5 text-orange-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>

                {/* Error Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground mb-1">
                    Connection Issue
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {streamError || 'An error occurred while processing your request.'}
                  </p>
                </div>

                {/* Retry Button */}
                <Button
                  onClick={restartFromLastUserMessage}
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0"
                >
                  <svg
                    className="w-3.5 h-3.5 mr-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Retry
                </Button>
              </div>
            </div>
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