
import { ChatStreamResponse } from "../services/chat-service.js";
import type { Message, Tool } from "./remote-llm-model.js";

export type LLMModelStreamResponse = Exclude<ChatStreamResponse, { type: 'message_start' | 'content_complete' }>;

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

  abstract streamResponse(messages: Message[], abortController?: AbortController, tools?: Tool[]): AsyncGenerator<LLMModelStreamResponse, void, void>;

  abstract structuredResponse<R>(messages: Message[], grammar: any, tools?: Tool[]): Promise<R>;
}