import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { use } from "./use";

// Type definitions based on the example structure
export interface Message {
  id: number;
  chatId: number;
  type: "user" | "assistant" | "system";
  content: string;
  status: "success" | "pending" | "error";
  createdAt: string;
  updatedAt: string;
  Attachments: any[];
}

export interface MessagesResponse {
  rows: Message[];
  count: number;
}

export interface SendMessageOptions {
  content?: string;
  onSuccess?: (message: Message) => void;
  onError?: (error: Error) => void;
}

export function useChat(chatId: number) {
  const { data: initialData, error: fetchError, isLoading, refetch } = use<MessagesResponse>({ fetcher: async () => await window.electronAPI.chat.message.getByChat(chatId), dependencies: [chatId] });
  const { data: chatRoomData, refetch: refetchChatRoomData } = use<{ title: string }>({ fetcher: async () => await window.electronAPI.chat.getById(chatId), dependencies: [chatId] });
  const { data: mainAgentData, refetch: refetchMainAgent } = use<{ llmId: number, id: number }>({ fetcher: async () => await window.electronAPI.agent.getMain() });

  const [messages, setMessages] = useState<Message[]>([]);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const optimisticIdCounter = useRef(-1);

  useEffect(() => {
    const onSidebarRefresh = () => refetchChatRoomData();
    window.addEventListener("sidebar.refresh", onSidebarRefresh);
    return () => {
      window.removeEventListener("sidebar.refresh", onSidebarRefresh);
    };
  }, [refetchChatRoomData])

  // Clear all messages immediately when chatId changes
  useEffect(() => {
    setMessages([]);
    setOptimisticMessages([]);
    optimisticIdCounter.current = -1;
  }, [chatId]);

  // Update local messages when initial data loads
  useEffect(() => {
    if (initialData?.rows) {
      setMessages(initialData.rows);
    }
  }, [initialData]);

  // Combine real messages with optimistic updates
  const allMessages = useMemo(() => {
    const combined = [...messages, ...optimisticMessages];
    return combined.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      // If dates are the same, prioritize real messages (positive IDs) over optimistic ones (negative IDs)
      if (dateA === dateB) {
        return b.id - a.id;
      }
      return dateA - dateB;
    });
  }, [messages, optimisticMessages]);

  const sendMessage = useCallback(async (options: SendMessageOptions) => {
    const { content = '', onSuccess, onError } = options;

    if (!content.trim() || isSending) return;

    setIsSending(true);

    // Create optimistic message
    const optimisticMessage: Message = {
      id: optimisticIdCounter.current--,
      chatId,
      type: 'user',
      content: content.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      Attachments: []
    };

    // Add optimistic message immediately
    setOptimisticMessages(prev => [...prev, optimisticMessage]);

    try {
      // Send message to backend
      const createdMessage = await window.electronAPI.chat.message.create({
        chatId,
        type: 'user',
        content: content.trim(),
      });

      // Remove optimistic message and add the real message to our local state
      setOptimisticMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setMessages(prev => [...prev, createdMessage]);

      onSuccess?.(createdMessage);
    } catch (err) {
      // Update optimistic message status to error
      setOptimisticMessages(prev =>
        prev.map(msg =>
          msg.id === optimisticMessage.id
            ? { ...msg, status: 'error' as const }
            : msg
        )
      );

      const error = err instanceof Error ? err : new Error('Failed to send message');
      onError?.(error);
    } finally {
      setIsSending(false);
    }
  }, [chatId, isSending]);

  const retryMessage = useCallback(async (messageId: number) => {
    const failedMessage = optimisticMessages.find(msg => msg.id === messageId && msg.status === 'error');
    if (!failedMessage) return;

    await sendMessage({ content: failedMessage.content });

    // Remove the failed message
    setOptimisticMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, [optimisticMessages, sendMessage]);

  const clearOptimisticMessages = useCallback(() => {
    setOptimisticMessages([]);
  }, []);

  const refresh = useCallback(async () => {
    clearOptimisticMessages();
    await refetch();
  }, [refetch, clearOptimisticMessages]);

  return {
    chatTitle: chatRoomData?.title ?? 'New Chat',
    mainAgent: mainAgentData,
    selectedLLM: mainAgentData?.llmId ?? null,
    setSelectedLLM: (llmId: number) => {
      console.log(llmId)
      window.electronAPI.agent.update(mainAgentData?.id ?? 0, { llmId }).then(() => {
        refetchMainAgent();
      })
    },
    messages: allMessages,
    error: fetchError,
    isLoading,
    isSending,
    sendMessage,
    retryMessage,
    refresh,
    clearOptimisticMessages,
    totalCount: messages.length + optimisticMessages.length
  };
}