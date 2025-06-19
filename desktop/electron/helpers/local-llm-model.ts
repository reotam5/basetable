import { app } from "electron";
import { join } from "path";
import { subprocessManager } from "../subprocess/subprocess-manager.js";
import { BaseLLMModel, LLMModelResponseChunk } from "./base-llm-model.js";

export class LocalLLMModel extends BaseLLMModel {
  private modelPath: string;

  constructor(displayName: string, modelPath: string, config: typeof LocalLLMModel.prototype.config = {}) {
    super(displayName, config);
    this.modelPath = modelPath;
  }

  async initialize(): Promise<void> {
    subprocessManager.startProcess({
      modulePath: 'llm-subprocess.js',
      serviceName: this.modelPath,
      args: [join(app.getPath('userData'), 'models', this.modelPath)],
    })
  }

  async *streamResponse(prompt: string, abortController?: AbortController) {
    const randomId = Math.random().toString(36).substring(2, 15);
    const onAort = () => {
      subprocessManager.sendMessage(this.modelPath, {
        type: 'abort',
        id: randomId,
      })
    }
    abortController?.signal.addEventListener('abort', onAort)

    const data = subprocessManager.sendMessageGenerator<LLMModelResponseChunk>(this.modelPath, {
      type: 'prompt',
      prompt: prompt,
      id: randomId,
    })
    for await (const chunk of data) {
      yield chunk;
    }

    abortController?.signal.removeEventListener('abort', onAort);
  }

  async structuredResponse(prompt: string, grammar: any) {
    return await subprocessManager.sendMessage(this.modelPath, {
      type: 'structuredResponse',
      prompt: prompt,
      grammar: grammar
    })
  }


  /**
   * local LLM models are always available. 
   */
  isAvailable() {
    return Promise.resolve(true);
  }
}