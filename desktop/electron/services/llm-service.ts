import { asc } from 'drizzle-orm';
import { database } from '../database/database.js';
import { llm } from '../database/tables/llm.js';
import { Logger } from '../helpers/custom-logger.js';
import { event, service } from '../helpers/decorators.js';

@service
class LLMService {

  @event('llm.getAll', 'handle')
  public async getLLMs() {
    try {
      const llms = await database()
        .select()
        .from(llm)
        .orderBy(asc(llm.display_name));

      return llms;
    } catch (error) {
      Logger.error("Error fetching LLMs:", error);
      return [];
    }
  }
}

const instance = new LLMService();
export { instance as LLMService };

