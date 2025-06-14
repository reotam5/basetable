import { and, desc, eq, exists, like, or } from 'drizzle-orm';
import { database } from '../database/database.js';
import { chat } from '../database/tables/chat.js';
import { message } from '../database/tables/message.js';
import { AuthHandler } from '../helpers/auth-handler.js';
import { chatOrchestrator } from '../helpers/chat-orchestrator.js';
import { Logger } from '../helpers/custom-logger.js';
import { event, service, streamHandler } from '../helpers/decorators.js';
import { StreamContext } from '../helpers/stream-manager.js';

@service
class ChatService {
  @streamHandler('chat.stream')
  async handleChatStream(data: ChatStreamData, stream: StreamContext) {
    try {
      const abortController = new AbortController();
      const iterator = chatOrchestrator.processMessage(data.chatId, data.message, abortController);

      // send message start notification
      stream.write({
        type: 'message_start',
        data: {
          chatId: data.chatId,
          userMessage: {
            content: data.message,
          }
        }
      } as ChatResponseChunk);


      // stream the response chunks
      for await (const chunk of iterator) {
        if (stream.isStreamEnded()) {
          abortController.abort();
          break;
        }
        stream.write({
          type: chunk.type,
          data: {
            chunk: chunk.delta,
            fullContent: chunk.content,
          }
        })
      }

      // complete the stream
      stream.end({ type: 'content_complete' } as ChatResponseChunk);

    } catch (error) {
      Logger.error("Error in chat stream handler:", error);
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


interface ChatStreamData {
  chatId: number;
  message: string;
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

type ChatResponseChunk = ChatResponseChunk_MessageStart | ChatResponseChunk_ContentChunk | ChatResponseChunk_ContentComplete | ChatResponseChunk_Error;
