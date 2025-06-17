import { asc, eq } from 'drizzle-orm';
import { app } from 'electron';
import { existsSync, unlink } from 'fs';
import { join } from 'path';
import { database } from '../database/database.js';
import { llm } from '../database/tables/llm.js';
import { agent } from '../database/tables/agent.js';
import { Logger } from '../helpers/custom-logger.js';
import { event, service } from '../helpers/decorators.js';
import { subprocessManager } from '../subprocess/subprocess-manager.js';

@service
class LLMService {

  @event('llm.getAll', 'handle')
  public async getLLMs() {
    try {
      const llms = (await database()
        .select()
        .from(llm)
        .orderBy(asc(llm.display_name)))
        .filter(item => existsSync(join(app.getPath('userData'), 'models', item.model_path)));

      // this should aggregate results from remote llm providers
      return llms.map((llm) => ({
        ...llm,
        type: 'local'
      }));
    } catch (error) {
      Logger.error("Error fetching LLMs:", error);
      return [];
    }
  }

  @event('llm.getAllLocal', 'handle')
  public async getLocalLLMs() {
    try {
      const llms = await database()
        .select()
        .from(llm)
        .orderBy(asc(llm.display_name))

      return llms.map((llm) => ({
        ...llm,
        is_downloaded: existsSync(join(app.getPath('userData'), 'models', llm.model_path)),
      }));
    } catch (error) {
      Logger.error("Error fetching local LLMs:", error);
      return [];
    }
  }

  @event('llm.download', 'handle')
  public async downloadLLM(data: typeof llm.$inferSelect) {
    subprocessManager.sendMessage('localModelDownload', {
      type: 'startDownload',
      url: data.download_url,
      output: data.model_path,
    })
  }

  @event('llm.cancelDownload', 'handle')
  public async cancelDownload(data: typeof llm.$inferSelect) {
    subprocessManager.sendMessage('localModelDownload', {
      type: 'cancelDownload',
      url: data.download_url
    });
  }

  @event('llm.delete', 'handle')
  public async deleteLLM(data: typeof llm.$inferSelect) {
    try {
      // Check if any agents are using this LLM
      const agentsUsingLLM = await database()
        .select()
        .from(agent)
        .where(eq(agent.llm_id, data.id));

      if (agentsUsingLLM.length > 0) {
        Logger.warn(`Cannot delete LLM ${data.display_name}: It is being used by ${agentsUsingLLM.length} agent(s)`);
        return { 
          success: false, 
          error: `Cannot delete this model. It is being used by ${agentsUsingLLM.length} agent(s). Please reassign those agents to different models first.` 
        };
      }

      const modelPath = join(app.getPath('userData'), 'models', data.model_path);
      if (existsSync(modelPath)) {
        unlink(modelPath, (err) => {
          if (err) {
            Logger.error("Error deleting model file:", err);
          } else {
            Logger.info(`Model file ${data.model_path} deleted successfully.`);
          }
        });
      }

      return { success: true };
    } catch (error) {
      Logger.error("Error deleting LLM:", error);
      return { success: false, error: "Failed to delete the model. Please try again." };
    }
  }
}

const instance = new LLMService();
export { instance as LLMService };

