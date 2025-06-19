import { LLamaChatPromptOptions } from "node-llama-cpp";
import { BaseLLMModel } from "./base-llm-model.js";
import { LocalLLMModel } from "./local-llm-model.js";
import { RemoteLLMConfig, RemoteLLMModel } from "./remote-llm-model.js";

type LLMModelConfig = ({
  type: 'local'
  modelPath: string
  config?: LLamaChatPromptOptions
} | {
  type: 'remote'
  config: RemoteLLMConfig
} | {
  type: 'unknown'
}) & {
  displayName: string
}

export class LLMModelFactory {
  private constructor() { }

  static createModel(config: LLMModelConfig): BaseLLMModel {
    switch (config.type) {
      case 'local':
        return new LocalLLMModel(config.displayName, config.modelPath, config.config);
      case 'remote':
        return new RemoteLLMModel(config.displayName, config.config)
      default:
        throw new Error(`Unknown LLM model type: ${config.type}`);
    }
  }
}