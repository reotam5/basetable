import { and, desc, eq, exists, like, or } from 'drizzle-orm';
import { database } from '../database/database.js';
import { chat } from '../database/tables/chat.js';
import { mcp_server } from '../database/tables/mcp-server.js';
import { message } from '../database/tables/message.js';
import { tool_call } from '../database/tables/tool-call.js';
import { AuthHandler } from '../helpers/auth-handler.js';
import { LLMModelStreamResponse } from '../helpers/base-llm-model.js';
import { chatOrchestrator } from '../helpers/chat-orchestrator.js';
import { Logger } from '../helpers/custom-logger.js';
import { event, service, streamHandler, streamInitializer } from '../helpers/decorators.js';
import { ToolCall } from '../helpers/remote-llm-model.js';
import { StreamContext } from '../helpers/stream-manager.js';
import { MessageService } from './message-service.js';

type _ChatStreamStart =
  | {
    type: 'message_start';
    data: {
      chatId: number;
      message: string;
      attachedFiles?: Array<{ path: string; name: string }>; // I don't think so.. but we'll fix once we support attachments
      longTextDocuments?: Array<{
        id: string;
        content: string;
        title: string;
      }>;
    }
  }
  | {
    type: 'function_call_confirmation';
    data: {
      confirmed: boolean;
    } & typeof tool_call.$inferSelect
  }
  | {
    type: 'resume_from_last_user_message';
    data: {
      chatId: number;
    }
  }

type _ChatStreamResponse =
  | { type: 'message_start' }
  | { type: 'content_complete' }
  | {
    type: "function_call";
    tool_call?: {
      raw: ToolCall,
      resolved?: {
        tool_call: typeof tool_call.$inferSelect,
        mcp_server: typeof mcp_server.$inferSelect,
      }
    },
    updated_tool_call?: DeepPartial<ChatStreamResponseFunctionCallChunk['tool_call']>
  }
  | {
    type: 'content_chunk';
    content: string;
    thought?: string;
    search_results?: Array<{
      title: string;
      url: string;
    }>;
    metadata?: typeof message.$inferInsert['metadata'];
  };


// This type is what you receive from renderer side when starting a chat stream
export type ChatStreamStart = _ChatStreamStart;
export type ChatStreamStartNormalMessage = Extract<ChatStreamStart, { type: 'message_start' }>;
export type ChatStreamStartFunctionCall = Extract<ChatStreamStart, { type: 'function_call_confirmation' }>;


// This type os what you send back to renderer side during the chat stream
export type ChatStreamResponse = _ChatStreamResponse;
export type ChatStreamResponseMessageStart = Extract<ChatStreamResponse, { type: 'message_start' }>;
export type ChatStreamResponseContentComplete = Extract<ChatStreamResponse, { type: 'content_complete' }>;
export type ChatStreamResponseThoughtChunk = Extract<ChatStreamResponse, { type: 'thought_chunk' }>;
export type ChatStreamResponseContentChunk = Extract<ChatStreamResponse, { type: 'content_chunk' }>;
export type ChatStreamResponseFunctionCallChunk = Extract<ChatStreamResponse, { type: 'function_call' }>;
export type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;


@service
class ChatService {

  @streamInitializer('chat.stream')
  async initializeChatStream({ type, data }: ChatStreamStart) {
    // delete previous messages to correct the chat state.
    if (type === 'message_start' || type === 'resume_from_last_user_message') {
      await MessageService.deleteUntilLastSuccessMessage(data.chatId);
    }


    // unlike resuming the chat, we need to clear the last user message and create new one
    if (type === 'message_start') {
      // we cannot start message following a user message because user and assistant message must alternate
      const lastMessage = await MessageService.getLastMessage(data.chatId);
      if (lastMessage && lastMessage.role === 'user') {
        await MessageService.deleteMessageById(lastMessage.id);
      }

      try {
        const response = await MessageService.storeUserMessage(
          data.chatId,
          data.message,
          data.attachedFiles,
          { long_text_documents: data.longTextDocuments }
        );
        return response
      } catch (error) {
        Logger.error("Error storing user message:", error);
        throw new Error('Failed to store user message');
      }
    }
  }


  @streamHandler('chat.stream')
  async handleChatStream({ type, data }: ChatStreamStart, stream: StreamContext<ChatStreamResponse>) {
    const abortController = new AbortController();
    try {
      let iterator: AsyncGenerator<LLMModelStreamResponse> | undefined = undefined;

      if (type === 'function_call_confirmation') {
        iterator = chatOrchestrator.processFunctionCallConfirmation(data, abortController);
      }

      if (type === 'message_start') {
        // reject pending tool calls if theres any
        const pendingToolCalls = await MessageService.getPendingToolCalls(data.chatId);
        for (const toolCall of pendingToolCalls) {
          const updatedToolCall = await MessageService.rejectToolCall(toolCall.id);
          stream.write({
            type: 'function_call',
            updated_tool_call: {
              resolved: {
                tool_call: updatedToolCall,
              }
            }
          })
        }

        iterator = chatOrchestrator.processMessage(data.chatId, data.message, data.attachedFiles, data.longTextDocuments, abortController);
      }

      if (type === 'resume_from_last_user_message') {
        iterator = chatOrchestrator.processMessage(data.chatId, undefined, undefined, undefined, abortController);
      }

      if (iterator === undefined) {
        throw new Error('Invalid stream type');
      }

      // send message start notification
      stream.write({ type: 'message_start' });


      // stream the response chunks
      for await (const chunk of iterator) {
        if (stream.isStreamEnded()) {
          abortController.abort();
          break;
        }
        stream.write(chunk)
      }

      // complete the stream
      stream.end({ type: 'content_complete' });

    } catch (error) {
      abortController.abort();
      stream.error(error instanceof Error ? error.message : 'Unknown error occurred')
    }
  }

  @event('chat.getAll', 'handle')
  public async getChats(options: {
    limit?: number;
    offset?: number;
    search?: string;
  } = {}) {
    try {
      const whereConditions = [eq(chat.user_id, AuthHandler.profile!.sub)];

      if (options.search) {
        // Search in both chat title and message content
        const searchConditions = or(
          like(chat.title, `%${options.search}%`),
          // Check if any message in this chat contains the search term
          exists(
            database()
              .select()
              .from(message)
              .where(
                and(
                  eq(message.chat_id, chat.id),
                  like(message.content, `%${options.search}%`)
                )
              )
          )
        )!;
        whereConditions.push(searchConditions);
      }

      const rows = await database()
        .select()
        .from(chat)
        .where(and(...whereConditions))
        .limit(options.limit || 50)
        .offset(options.offset || 0)
        .orderBy(desc(chat.updated_at));

      return rows;
    } catch (error) {
      Logger.error("Error fetching chats:", error);
      return []
    }
  }

  @event('chat.getById', 'handle')
  public async getChatById(chatId: number) {
    try {
      const [data] = await database()
        .select()
        .from(chat)
        .where(and(
          eq(chat.id, chatId),
          eq(chat.user_id, AuthHandler.profile!.sub)
        ))
      return data;
    } catch (error) {
      Logger.error("Error fetching chat by ID:", error);
      return null;
    }
  }

  @event('chat.create', 'handle')
  public async createChat(data: {
    title?: string;
    metadata?: any;
  }) {
    try {
      const [newChat] = await database()
        .insert(chat)
        .values({
          title: data.title || '',
          user_id: AuthHandler.profile!.sub,
        })
        .returning()
      return newChat;
    } catch (error) {
      Logger.error("Error creating chat:", error);
      return null;
    }
  }

  @event('chat.update', 'handle')
  public async updateChat(chatId: number, updates: typeof chat.$inferInsert) {
    try {
      const rows = await database()
        .update(chat)
        .set({
          ...updates,
          id: chatId,
          user_id: AuthHandler.profile!.sub,
        })
        .where(and(
          eq(chat.id, chatId),
          eq(chat.user_id, AuthHandler.profile!.sub)
        ))

      return rows.changes > 0;
    } catch (error) {
      Logger.error("Error updating chat:", error);
      return false;
    }
  }

  @event('chat.delete', 'handle')
  public async deleteChat(chatId: number) {
    try {
      // delete all tool calls associated with this chat
      await database()
        .delete(tool_call)
        .where(eq(tool_call.chat_id, chatId));

      // delete all messages in this chat
      await database()
        .delete(message)
        .where(eq(message.chat_id, chatId));

      const deletedRows = await database()
        .delete(chat)
        .where(and(
          eq(chat.id, chatId),
          eq(chat.user_id, AuthHandler.profile!.sub)
        ));

      return deletedRows.changes > 0;
    } catch (error) {
      Logger.error("Error deleting chat:", error);
      return false;
    }
  }
}

const instance = new ChatService();
export { instance as ChatService };

