import { LLMService } from "../services/index.js";
import { BaseLLMModel } from "./base-llm-model.js";
import { LLMModelFactory } from "./llm-model-factory.js";

class LLMModelRegistry {
  private models: Map<string, BaseLLMModel> = new Map();
  private defaultModel: BaseLLMModel | null = null;

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

        if (llm.is_default && await model.isAvailable()) {
          this.defaultModel = model;
        }
      }
    }))
    if (!this.defaultModel) {
      for (const model of this.models.values()) {
        if (await model.isAvailable()) {
          this.defaultModel = model;
          break;
        }
      }
    }
  }

  getDefaultModel() {
    return this.defaultModel
  }

  getModel(modelId: string): BaseLLMModel | undefined {
    return this.models.get(modelId);
  }
}

const llmModelRegistry = new LLMModelRegistry();
export { llmModelRegistry as LLMModelRegistry };
