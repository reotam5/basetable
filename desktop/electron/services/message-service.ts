import { and, asc, desc, eq } from 'drizzle-orm';
import { database } from '../database/database.js';
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

      return rows;
    } catch (error) {
      Logger.error("Error fetching messages:", error);
      return [];
    }
  }
}

const instance = new MessageService();
export { instance as MessageService };
