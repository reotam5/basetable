
/**
 * Response chunk for streaming
 */
export interface LLMModelResponseChunk {
  type: 'content_chunk';
  content: string;
  delta: string;
  search_results?: Array<{
    title: string;
    url: string;
  }>;
}

/**
 * Complete model response
 */
export interface LLMModelResponse {
  content: string;
}

export abstract class BaseLLMModel {
  protected config: Record<string, any>;
  protected displayName: string;

  constructor(displayName: string, config: Record<string, any> = {}) {
    this.config = config;
    this.displayName = displayName;
  }

  getDisplayName(): string {
    return this.displayName;
  }

  abstract initialize(): Promise<void>;

  abstract isAvailable(): Promise<boolean>

  abstract streamResponse(prompt: string, abortController?: AbortController): AsyncGenerator<LLMModelResponseChunk, void, void>;

  abstract structuredResponse<R>(prompt: string, grammar: any): Promise<R>;
}