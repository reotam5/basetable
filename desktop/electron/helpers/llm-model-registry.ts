import { LLMService } from "../services/index.js";
import { BaseLLMModel } from "./base-llm-model.js";
import { LLMModelFactory } from "./llm-model-factory.js";

class LLMModelRegistry {
  private models: Map<string, BaseLLMModel> = new Map();
  private defaultModel!: BaseLLMModel;

  async sync(): Promise<void> {
    const llms = await LLMService.getLLMs()
    await Promise.all(llms.map(async (llm) => {
      if (!this.models.has(llm.id.toString())) {
        const model = LLMModelFactory.createModel({
          type: llm.type as any,
          modelPath: llm.model_path,
          config: llm.config || {}
        });
        await model.initialize();
        this.models.set(llm.id.toString(), model);

        if (llm.is_default) {
          this.defaultModel = model;
        }
      }
    }))
  }

  getDefaultModel() {
    return this.defaultModel
  }

  getModel(modelId: string): BaseLLMModel | undefined {
    return this.models.get(modelId);
  }

  getAllModels(): BaseLLMModel[] {
    return Array.from(this.models.values());
  }

  async getAvailableModels(): Promise<BaseLLMModel[]> {
    return Promise.all(
      Array.from(this.models.values()).map(async (model) => {
        const available = await model.isAvailable();
        return available ? model : null;
      })
    ).then(models => models.filter(Boolean) as BaseLLMModel[]);
  }
}

const llmModelRegistry = new LLMModelRegistry();
export { llmModelRegistry as LLMModelRegistry };
