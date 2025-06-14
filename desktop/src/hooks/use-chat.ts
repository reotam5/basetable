import { useCallback, useEffect, useMemo, useState } from "react";
import { use } from "./use";
import { useStream } from "./use-stream";

export interface SendMessageOptions {
  content?: string;
}

interface ChatResponseChunk_MessageStart {
  type: 'message_start';
  data: {
    chatId: number;
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
  };
}

interface ChatResponseChunk_ContentComplete {
  type: 'content_complete';
}

type ChatStreamChunk = ChatResponseChunk_MessageStart | ChatResponseChunk_ContentChunk | ChatResponseChunk_ContentComplete;
interface ChatStreamData {
  chatId: number;
  message: string;
}

export function useChat(chatId: number) {
  const { data: initialData, error: fetchError, isLoading } = use({
    fetcher: async () => {
      setMessages([]);
      setNewChatIds([]);
      return await window.electronAPI.chat.message.getByChat(chatId)
    },
    dependencies: [chatId]
  });
  const { data: chatRoomData, refetch: refetchChatRoomData } = use({ fetcher: async () => await window.electronAPI.chat.getById(chatId), dependencies: [chatId] });
  const { data: mainAgentData, refetch: refetchMainAgent } = use({ fetcher: async () => await window.electronAPI.agent.getMain() });

  const [messages, setMessages] = useState<typeof initialData>([]);
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWaitingAI, setIsWaitingAI] = useState(false);
  const [newChatIds, setNewChatIds] = useState<number[]>([]);

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
          setIsWaitingAI(true);
          setMessages(prev => [
            {
              id: new Date().getTime(), // Use timestamp as a temporary ID
              chat_id: chatId,
              type: 'user',
              content: chunk.data.userMessage.content,
              status: 'success',
              created_at: new Date(),
              updated_at: new Date(),
              metadata: null,
            },
            ...(prev ?? []),
          ])
          break;
        case 'content_chunk': {
          setIsStreaming(true);
          setIsWaitingAI(false);
          setMessages(prev => {
            const lastAssistantMessage = prev?.[0]?.type === 'assistant' ? prev[0] : null;
            return [
              {
                id: new Date().getTime(), // Use timestamp as a temporary ID
                chat_id: chatId,
                type: 'assistant',
                content: chunk.data.fullContent,
                status: 'pending',
                created_at: new Date(),
                updated_at: new Date(),
                metadata: null,
              },
              ...(lastAssistantMessage ? prev?.slice(1) : prev) ?? [],
            ]
          })
          break;
        }
        case 'content_complete': {
          setIsStreaming(false);
          setMessages(prev => {
            const lastAssistantMessage = prev?.[0]?.type === 'assistant' ? prev[0] : null;
            if (lastAssistantMessage) {
              return [
                {
                  ...lastAssistantMessage,
                  status: 'success',
                },
                ...prev?.slice(1) ?? [],
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

  useEffect(() => {
    const onTitleUpdate = (chatId: number) => {
      refetchChatRoomData()
      setNewChatIds(prev => [...prev, chatId])
    }
    const cleanup = window.electronAPI.chat.onTitleUpdate(onTitleUpdate);
    return () => {
      cleanup()
    }
  }, [refetchChatRoomData])

  // Update local messages when initial data loads
  useEffect(() => {
    if (initialData?.length) {
      setMessages(initialData);
    }
  }, [initialData]);

  // Combine real messages with streaming messages
  const allMessages = useMemo(() => {
    return messages?.filter(msg => msg.chat_id === chatId).reverse();
  }, [chatId, messages]);

  const sendMessage = useCallback(async (options: SendMessageOptions) => {
    const { content = '' } = options;
    if (!content.trim() || isSending || isStreaming) return;

    setIsSending(true);

    // send message by starting a stream
    stream.startStream(chatId.toString(), {
      chatId: chatId,
      message: content.trim(),
    });

  }, [chatId, isSending, isStreaming, stream]);

  return {
    chatTitle: chatRoomData?.title,
    newChatIds,
    selectedLLM: mainAgentData?.llm_id ?? null,
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
    isWaitingAI: isWaitingAI || allMessages?.length === 1,
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
              ...prev?.slice(1) ?? [],
            ]
          }
          return prev;
        })
      })
    },
  };
}