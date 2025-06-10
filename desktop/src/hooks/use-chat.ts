import { useCallback, useEffect, useMemo, useState } from "react";
import { use } from "./use";
import { useStream } from "./use-stream";

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
  attachments?: Blob[];
}

interface ChatResponseChunk_MessageStart {
  type: 'message_start';
  data: {
    chatId: number;
    agentMessageId: number;
    userMessageId: number;
    userMessage: {
      content: string;
    }
  }
}

interface ChatResponseChunk_ContentChunk {
  type: 'content_chunk';
  data: {
    chunk: string;
    fullContent: string;
    agentMessageId: number;
    userMessageId: number;
  };
}

interface ChatResponseChunk_ContentComplete {
  type: 'content_complete';
  data: {
    agentMessageId: number;
    userMessageId: number;
  }
}

interface ChatResponseChunk_Error {
  type: 'error';
  data: {
    error: string;
    chatId?: number;
    userMessageId: number;
    agentMessageId: number;
  };
}

type ChatStreamChunk = ChatResponseChunk_MessageStart | ChatResponseChunk_ContentChunk | ChatResponseChunk_ContentComplete | ChatResponseChunk_Error;
interface ChatStreamData {
  chatId: number;
  message: string;
  attachments?: Array<{
    filename: string;
    type: string;
    data: string;
  }>;
}

export function useChat(chatId: number) {
  const { data: initialData, error: fetchError, isLoading } = use<MessagesResponse>({
    fetcher: async () => {
      setMessages([]);
      return await window.electronAPI.chat.message.getByChat(chatId)
    },
    dependencies: [chatId]
  });
  const { data: chatRoomData, refetch: refetchChatRoomData } = use<{ title: string }>({ fetcher: async () => await window.electronAPI.chat.getById(chatId), dependencies: [chatId] });
  const { data: mainAgentData, refetch: refetchMainAgent } = use<{ llmId: number, id: number }>({ fetcher: async () => await window.electronAPI.agent.getMain() });

  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const streamOptions = useMemo(() => ({
    onComplete: () => {
      setIsStreaming(false);
    },
    onError: () => {
      setIsStreaming(false);
    },
    onData: (chunk: ChatStreamChunk) => {
      switch (chunk.type) {
        case 'message_start':
          setIsSending(false);
          setMessages(prev => [
            {
              id: chunk.data.userMessageId,
              chatId: chatId,
              type: 'user',
              content: chunk.data.userMessage.content,
              status: 'success',
              Attachments: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            ...prev,
          ])
          break;
        case 'content_chunk': {
          setIsStreaming(true);
          setMessages(prev => {
            const lastAssistantMessage = prev?.[0]
            return [
              {
                id: chunk.data.agentMessageId,
                chatId: chatId,
                type: 'assistant',
                content: chunk.data.fullContent,
                status: 'pending',
                Attachments: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              ...(lastAssistantMessage?.id === chunk.data.agentMessageId) ? prev.slice(1) : prev,
            ]
          })
          break;
        }
        case 'content_complete': {
          setIsStreaming(false);
          setMessages(prev => {
            const lastAssistantMessage = prev?.[0];
            if (lastAssistantMessage?.id === chunk.data.agentMessageId) {
              return [
                {
                  ...lastAssistantMessage,
                  status: 'success',
                },
                ...prev.slice(1),
              ];
            }
            return prev;
          });
          break;
        }
      }
    },
  }), [chatId]);


  const stream = useStream<ChatStreamData, ChatStreamChunk>({ channel: 'chat.stream', ...streamOptions });

  useEffect(() => {
    stream.resumeStream(chatId.toString(), streamOptions)
    return () => {
      setIsStreaming(false);
      stream.pauseStream(chatId.toString())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId])

  useEffect(() => {
    const onSidebarRefresh = () => refetchChatRoomData();
    window.addEventListener("sidebar.refresh", onSidebarRefresh);
    return () => {
      window.removeEventListener("sidebar.refresh", onSidebarRefresh);
    };
  }, [refetchChatRoomData])

  // Update local messages when initial data loads
  useEffect(() => {
    if (initialData?.rows) {
      setMessages(initialData.rows);
    }
  }, [initialData]);

  // Combine real messages with streaming messages
  const allMessages: Message[] = useMemo(() => {
    return messages.filter(msg => msg.chatId === chatId).reverse();
  }, [chatId, messages]);

  const sendMessage = useCallback(async (options: SendMessageOptions) => {
    const { content = '' } = options;
    if (!content.trim() || isSending || isStreaming) return;

    setIsSending(true);

    // send message by starting a stream
    stream.startStream(chatId.toString(), {
      chatId: chatId,
      message: content.trim(),
      attachments: [],
    });

  }, [chatId, isSending, isStreaming, stream]);

  return {
    chatTitle: chatRoomData?.title ?? 'New Chat',
    selectedLLM: mainAgentData?.llmId ?? null,
    setSelectedLLM: (llmId: number) => {
      window.electronAPI.agent.update(mainAgentData?.id ?? 0, { llmId }).then(() => {
        refetchMainAgent();
      })
    },
    messages: allMessages,
    error: fetchError,
    isLoading,
    isAgentResponding: isStreaming,
    isSending,
    sendMessage,
    cancel: () => {
      stream.cancelStream(chatId.toString()).then(() => {
        setMessages(prev => {
          const lastAssistantMessage = prev?.[0];
          if (lastAssistantMessage?.type === 'assistant' && lastAssistantMessage.status === 'pending') {
            return [
              {
                ...lastAssistantMessage,
                status: 'success',
              },
              ...prev.slice(1),
            ]
          }
          return prev;
        })
      })
    },
  };
}