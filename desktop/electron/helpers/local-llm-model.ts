import { app } from "electron";
import { getLlama, LlamaChatSession } from 'node-llama-cpp';
import { join } from "path";
import { BaseLLMModel, LLMModelResponseChunk } from "./base-llm-model.js";
import { createStreamIterator } from "./createStreamIterator.js";

export class LocalLLMModel extends BaseLLMModel {
  private modelPath: string;
  private session!: LlamaChatSession;
  private llama!: Awaited<ReturnType<typeof getLlama>>;

  constructor(modelPath: string, config: typeof LocalLLMModel.prototype.config = {}) {
    super(config)
    this.modelPath = modelPath;
  }

  async initialize(): Promise<void> {
    this.llama = await getLlama();
    const model = await this.llama.loadModel({
      modelPath: join(app.getPath('userData'), 'models', this.modelPath),
    })
    const context = await model.createContext()
    this.session = new LlamaChatSession({
      contextSequence: context.getSequence(),
    });
  }

  async *streamResponse(prompt: string, abortController?: AbortController) {
    const streamIterator = createStreamIterator<LLMModelResponseChunk>();
    let fullContent = '';

    this.session.prompt(prompt, {
      ...this.config,
      signal: abortController?.signal,
      onResponseChunk: (chunk) => {
        if (chunk.text) {
          fullContent += chunk.text;
          streamIterator.push({
            type: 'content_chunk',
            delta: chunk.text,
            content: fullContent,
          })
        } else {
          streamIterator.complete()
        }
      }
    })

    for await (const chunk of streamIterator) {
      yield chunk;
    }
  }

  async structuredResponse<R>(prompt: string, grammar: Parameters<typeof this.llama.createGrammarForJsonSchema>[0]) {
    const structure = await this.llama.createGrammarForJsonSchema(grammar);
    const res = await this.session.prompt(prompt, { grammar: structure });
    return structure.parse(res) as R
  }


  /**
   * local LLM models are always available. 
   */
  isAvailable() {
    return Promise.resolve(true);
  }
}