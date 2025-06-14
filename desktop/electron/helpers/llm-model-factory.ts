import { LLamaChatPromptOptions } from "node-llama-cpp";
import { BaseLLMModel } from "./base-llm-model.js";
import { LocalLLMModel } from "./local-llm-model.js";
import { RemoteLLMModel } from "./remote-llm-model.js";

type LLMModelConfig = {
  type: 'local'
  modelPath: string
  config?: LLamaChatPromptOptions
} | {
  type: 'remote'
} | {
  type: 'unknown'
}

export class LLMModelFactory {
  private constructor() { }

  static createModel(config: LLMModelConfig): BaseLLMModel {
    switch (config.type) {
      case 'local':
        return new LocalLLMModel(config.modelPath, config.config);
      case 'remote':
        return new RemoteLLMModel(config)
      default:
        throw new Error(`Unknown LLM model type: ${config.type}`);
    }
  }
}