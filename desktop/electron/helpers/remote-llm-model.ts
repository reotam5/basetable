import { BaseLLMModel, LLMModelResponseChunk } from "./base-llm-model.js";

// refer to how local-llm-model is implemented
export class RemoteLLMModel extends BaseLLMModel {

  constructor(config: any) {
    super(config);
  }

  initialize(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  isAvailable(): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  streamResponse(): AsyncGenerator<LLMModelResponseChunk, void, void> {
    throw new Error("Method not implemented.");
  }

  structuredResponse<R>(): Promise<R> {
    throw new Error("Method not implemented.");
  }
}