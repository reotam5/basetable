import { ModelCtor } from "sequelize";
import { Database } from "../Database.js";
import { LLMs } from "../models/LLMs.js";

class LLMService {
  static #instance: LLMService;
  private model: ModelCtor<any> | undefined = undefined

  private constructor() { }

  public static get instance(): LLMService {
    if (!LLMService.#instance) {
      LLMService.#instance = new LLMService();
    }

    return LLMService.#instance;
  }

  public initialize(): void {
    this.model = Database.sequelize?.model(LLMs.name);
  }

  public async getLLMs(): Promise<any[]> {
    try {
      if (!this.model) {
        throw new Error("LLM model is not initialized.");
      }
      const llmList = await this.model.findAll();
      return llmList.map(llm => llm.get({ plain: true }));
    } catch {
      return [];
    }
  }

}

const service = LLMService.instance;
export { service as LLMService };

