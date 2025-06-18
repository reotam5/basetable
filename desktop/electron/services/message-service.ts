import { and, asc, desc, eq } from 'drizzle-orm';
import { database } from '../database/database.js';
import { chat } from '../database/tables/chat.js';
import { message } from '../database/tables/message.js';
import { Logger } from '../helpers/custom-logger.js';
import { event, service } from '../helpers/decorators.js';

@service
class MessageService {

  @event('message.getByChatId', 'handle')
  public async getMessagesByChatId(chatId: number) {
    try {
      const rows = await database()
        .select()
        .from(message)
        .where(and(
          eq(message.chat_id, chatId),
        ))
        .orderBy(
          desc(message.created_at),
          asc(message.type)
        );

      // Parse metadata from JSON string to object
      return rows.map(row => ({
        ...row,
        metadata: row.metadata ? (() => {
          try {
            return JSON.parse(row.metadata as unknown as string);
          } catch (error) {
            Logger.error("Error parsing message metadata:", error);
            return null;
          }
        })() : null
      }));
    } catch (error) {
      Logger.error("Error fetching messages:", error);
      return [];
    }
  }

  public async createMessage(data: typeof message.$inferInsert) {
    try {
      const [newMessage] = await database()
        .insert(message)
        .values({
          chat_id: data.chat_id,
          content: data.content,
          type: data.type,
          status: data.status,
          created_at: new Date(),
          updated_at: new Date(),
          metadata: data.metadata ? JSON.stringify(data.metadata) as any : null,
        })
        .returning();

      // update the chat's updated_at timestamp
      await database()
        .update(chat)
        .set({ updated_at: new Date().toISOString() })
        .where(eq(chat.id, data.chat_id));

      return {
        ...newMessage,
        metadata: newMessage.metadata ? (() => {
          try {
            return JSON.parse(newMessage.metadata as unknown as string);
          } catch (error) {
            Logger.error("Error parsing new message metadata:", error);
            return null;
          }
        })() : null
      };
    } catch (error) {
      Logger.error("Error creating message:", error);
      throw error;
    }
  }
}

const instance = new MessageService();
export { instance as MessageService };
