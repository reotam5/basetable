import { eq } from 'drizzle-orm';
import { database } from '../database/database.js';
import { agent_style } from '../database/tables/agent-style.js';
import { Logger } from '../helpers/custom-logger.js';
import { event, service } from '../helpers/decorators.js';

@service
class AgentStyleService {

  @event('agentStyle.getByType', 'handle')
  public async getStylesByType(type: 'tone' | 'style') {
    try {
      return await database()
        .select()
        .from(agent_style)
        .where(eq(agent_style.type, type))
    } catch (error) {
      Logger.error("Error fetching styles by type:", error);
      return [];
    }
  }

  @event('agentStyle.getTones', 'handle')
  public async getTones() {
    return this.getStylesByType('tone');
  }

  @event('agentStyle.getStyles', 'handle')
  public async getStylesOnly() {
    return this.getStylesByType('style');
  }
}

const instance = new AgentStyleService();
export { instance as AgentStyleService };

