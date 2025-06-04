import LLM from "../db/models/llm.model.js";
import { event, service } from "../helpers/decorators.js";

@service
export class LLMService {

  @event('llm.getAll', 'handle')
  public async getLLMs(): Promise<any[]> {
    try {
      const llms = await LLM.findAll({
        order: [['name', 'ASC']],
      });

      return llms.map(llm => llm.get({ plain: true }));
    } catch (error) {
      console.error("Error fetching LLMs:", error);
      return [];
    }
  }
}
