import { extend } from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatStreamResponse, ChatStreamStart, ChatStreamStartFunctionCall } from '../../electron/services/chat-service.js';
import { use } from "./use";
import { useStream } from "./use-stream";

export function useChat(chatId: number) {
  const { data: initialData, error: fetchError, isLoading } = use({
    fetcher: async () => {
      setMessages([]);
      setNewChatIds([]);
      setStreamError(null);
      if (aiWaitingIndicatorTimeout.current) clearTimeout(aiWaitingIndicatorTimeout.current)
      return await window.electronAPI.chat.message.getByChat(chatId)
    },
    dependencies: [chatId]
  });
  const { data: chatRoomData, refetch: refetchChatRoomData } = use({ fetcher: async () => await window.electronAPI.chat.getById(chatId), dependencies: [chatId] });

  const [messages, setMessages] = useState<typeof initialData>([]);
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWaitingAI, setIsWaitingAI] = useState(false);
  const [newChatIds, setNewChatIds] = useState<number[]>([]);
  const [streamError, setStreamError] = useState<string | null>(null);
  const aiWaitingIndicatorTimeout = useRef<NodeJS.Timeout | null>(null);

  const setAiWaitingIndicatorTimeout = () => {
    if (aiWaitingIndicatorTimeout.current) clearTimeout(aiWaitingIndicatorTimeout.current)
    aiWaitingIndicatorTimeout.current = setTimeout(() => {
      setIsWaitingAI(true)
    }, 500);
  }

  const streamOptions = useMemo(() => ({
    onComplete: () => {
      setIsStreaming(false);
      if (aiWaitingIndicatorTimeout.current) clearTimeout(aiWaitingIndicatorTimeout.current);
    },
    onError: (error: string) => {
      setIsStreaming(false);
      setIsWaitingAI(false);
      setIsSending(false);
      if (aiWaitingIndicatorTimeout.current) clearTimeout(aiWaitingIndicatorTimeout.current);
      if (error !== 'Stream cancelled by user') {
        setStreamError(error);
      }
    },
    onData: (chunk: ChatStreamResponse) => {
      setAiWaitingIndicatorTimeout();
      setStreamError(null);
      if (chunk.type === 'message_start') {
        setIsSending(false);
        setIsWaitingAI(true);
      } else if (chunk.type === 'content_complete') {
        setIsStreaming(false);
        setIsWaitingAI(false);
      } else if (chunk.type === 'content_chunk') {
        setIsStreaming(true);
        setIsWaitingAI(false);
      }

      if (chunk.type !== 'message_start') {
        setMessages(prev => {
          const lastMessage = prev?.[0];

          // change the last message to success
          if (chunk.type === 'content_complete') {
            if (!lastMessage) return prev;
            return [
              {
                ...prev?.[0],
                message: {
                  ...prev?.[0].message,
                  status: 'success',
                },
              },
              ...prev?.slice(1) ?? [],
            ] as NonNullable<typeof messages>;
          }


          const continuedMessage = (lastMessage?.message.role === 'assistant' && (lastMessage?.message.status === 'pending' || (chunk.type === 'function_call' && !!chunk.updated_tool_call))) ? lastMessage : null;

          // received function call update. we have to find the right tool call to update
          if (chunk.type === 'function_call' && !!chunk.updated_tool_call) {
            const targetToolCallId = chunk.updated_tool_call?.resolved?.tool_call?.id;
            return prev?.map(msg => {
              if (msg?.toolCalls?.find(tc => tc.id === targetToolCallId) === undefined) return msg;
              return {
                ...msg,
                toolCalls: msg.toolCalls.map(tc => tc.id === targetToolCallId ? extend({}, tc, chunk.updated_tool_call?.resolved?.tool_call) : tc)
              }
            }) as NonNullable<typeof messages>;
          }

          return [
            {
              message: {
                id: continuedMessage?.message.id ?? new Date().getTime(),
                chat_id: chatId,
                role: 'assistant',
                content: chunk.type === 'content_chunk' ? chunk.content : continuedMessage?.message.content ?? "",
                thought: chunk.type === 'content_chunk' ? chunk.thought : continuedMessage?.message.thought ?? "",
                status: chunk.type === 'function_call' ? 'success' : 'pending',
                created_at: continuedMessage?.message.created_at ?? new Date(),
                updated_at: new Date(),
                metadata: {
                  ...(continuedMessage?.message.metadata ?? {}),
                  ...(chunk.type !== 'function_call' ? chunk.metadata ?? {} : {}),
                },
              },
              toolCalls: chunk.type === 'function_call' ? [
                ...(continuedMessage?.toolCalls ?? []).map(tc => tc.id === chunk.updated_tool_call?.resolved?.tool_call?.id ? extend({}, tc, chunk.updated_tool_call?.resolved?.tool_call) : tc),
                ...(chunk.tool_call?.resolved?.tool_call ? [chunk.tool_call.resolved.tool_call] : []),
              ] : continuedMessage?.toolCalls
            },
            ...(continuedMessage ? prev?.slice(1) : prev) ?? []
          ] as NonNullable<typeof messages>;
        })
      }
    },
  }), [chatId]);


  const stream = useStream<ChatStreamStart, ChatStreamResponse>({ channel: 'chat.stream', ...streamOptions });

  useEffect(() => {
    stream.resumeStream(chatId.toString(), streamOptions).then((resumed) => {
      if (!resumed) {
        setIsStreaming(false);
        setIsWaitingAI(false);
        setIsSending(false);
      } else {
        setStreamError(null);
        setIsStreaming(true);
        setIsWaitingAI(true);
        setIsSending(false);
      }
    })
    return () => {
      setIsStreaming(false);
      stream.pauseStream(chatId.toString())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

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


  const allMessages = useMemo(() => {
    if (!messages?.length) return [];
    const filteredMessages = messages.filter(msg => {
      // Filter out messages that do not belong to the current chat
      if (msg.message.chat_id !== chatId) return false;

      return true
    });
    return filteredMessages.reverse();
  }, [chatId, messages]);

  // if message ends with user, and there is no stream connection, we detect error
  useEffect(() => {
    if (allMessages?.length > 0 && allMessages?.[allMessages.length - 1]?.message.role === 'user' && !isStreaming && !isSending && !isWaitingAI) {
      setStreamError('No response from AI. Please try again.');
    }
  }, [allMessages, isSending, isStreaming, isWaitingAI])

  const sendMessage = useCallback(async ({ message, attachedFiles, longTextDocuments }: Omit<Extract<ChatStreamStart, { type: 'message_start' }>['data'], 'chatId'>) => {
    if ((!message.trim() && !attachedFiles?.length && !longTextDocuments?.length) || isSending || isStreaming) return;

    setIsSending(true);

    // send message by starting a stream
    const response = await stream.startStream(chatId.toString(), {
      type: 'message_start',
      data: {
        chatId: chatId,
        message: message.trim(),
        attachedFiles: attachedFiles || [],
        longTextDocuments: longTextDocuments || [],
      }
    });

    if (!response?.initializerResponse) {
      setIsSending(false);
      setIsStreaming(false);
      setIsWaitingAI(false);
      return;
    }

    setMessages(prev => [
      response?.initializerResponse,
      ...(prev ?? [])
    ]);

  }, [chatId, isSending, isStreaming, stream]);

  return {
    chatTitle: chatRoomData?.title,
    newChatIds,
    messages: allMessages,
    error: fetchError,
    isLoading,
    isAgentResponding: isStreaming,
    isSending,
    isWaitingAI: isWaitingAI && !streamError,
    sendMessage,
    cancel: () => {
      stream.cancelStream(chatId.toString()).then(() => {
        setMessages(prev => {
          const lastMessage = prev?.[0];
          if (lastMessage?.message?.role === 'assistant' && lastMessage.message.status === 'pending') {
            return [
              {
                ...lastMessage,
                status: 'success',
              },
              ...prev?.slice(1) ?? [],
            ]
          }
          return prev;
        })
      })
    },
    sendToolCallConfirmation: useCallback(async (data: ChatStreamStartFunctionCall['data']) => {
      setIsSending(false);
      setIsWaitingAI(true);
      stream.startStream(chatId.toString(), {
        type: 'function_call_confirmation',
        data
      })
    }, [chatId, stream]),
    streamError,
    restartFromLastUserMessage: useCallback(async () => {
      stream.startStream(chatId.toString(), {
        type: 'resume_from_last_user_message',
        data: {
          chatId: chatId,
        }
      })
      setIsSending(false);
      setIsWaitingAI(true);
      setStreamError(null);
    }, [chatId, stream])
  };
}
