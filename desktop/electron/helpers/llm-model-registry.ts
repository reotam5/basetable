import { LLMService } from "../services/index.js";
import { BaseLLMModel } from "./base-llm-model.js";
import { Logger } from "./custom-logger.js";
import { LLMModelFactory } from "./llm-model-factory.js";

class LLMModelRegistry {
  private models: Map<string, BaseLLMModel> = new Map();
  private defaultModel: BaseLLMModel | null = null;

  async sync(): Promise<void> {
    const llms = await LLMService.getLLMs()
    await Promise.all(llms.map(async (llm) => {
      if (!this.models.has(llm.id.toString())) {
        try {
          const model = LLMModelFactory.createModel({
            ...(llm.type === 'local' ? {
              type: 'local',
              modelPath: llm.model_path,
              config: llm.config as any
            } : {
              type: 'remote',
              config: llm.config as any
            }),
            displayName: llm.display_name,
          });

          await model.initialize();
          this.models.set(llm.id.toString(), model);

          if (llm.is_default && await model.isAvailable()) {
            this.defaultModel = model;
          }
        } catch (error) {
          Logger.error(`Failed to initialize ${llm.type} model ${llm.display_name}:`, error);
          // Don't let one model failure block others
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

  async syncDefaultModel(): Promise<void> {
    const default_id = (await LLMService.getLLMs()).filter(llm => llm.is_default)[0]?.id;
    if (default_id && this.models.has(default_id.toString())) {
      this.defaultModel = this.models.get(default_id.toString())!;
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
