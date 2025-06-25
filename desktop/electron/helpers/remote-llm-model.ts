import { api } from "./axios-api.js";
import { BaseLLMModel, LLMModelStreamResponse } from "./base-llm-model.js";
import { createStreamIterator } from "./createStreamIterator.js";
import { Logger } from "./custom-logger.js";

// Types matching the proxy server structure
export interface ToolCall {
  id: string;
  tool_type: string;
  call: {
    name: string;
    arg: string;
  };
}

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
  thoughts?: string[];
}

export interface ParameterProperty {
  type: string;
  description: string;
  enum?: string[];
  default?: any;
}

export interface ParameterSchema {
  properties: Record<string, ParameterProperty>;
  required: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ParameterSchema;
}

export interface Tool {
  tool_type: string;
  tool_definition: ToolDefinition;
}

export interface RemoteLLMConfig {
  provider_id: string;
  base_url: string;
  model: string;
  capabilities: {
    function_calling: boolean;
    streaming: boolean;
  };
  limits: {
    context_window: number;
    max_output_tokens: number;
  };
  pricing: {
    prompt_token_price: number;
    completion_token_price: number;
    currency: string;
    unit: string;
  };
  endpoints: {
    chat: {
      name: string;
      path: string;
      status: string;
      health: string;
      last_health_check: string;
    };
  };
  request_template: string;
  response_template: string;
}

export class RemoteLLMModel extends BaseLLMModel {
  private remoteConfig: RemoteLLMConfig;

  constructor(displayName: string, config: RemoteLLMConfig) {
    super(displayName, config);
    this.remoteConfig = config;
  }

  async initialize(): Promise<void> { }

  async isAvailable(): Promise<boolean> {
    try {
      // Check if the provider endpoint is healthy
      const response = await api.get('/v1/providers');
      const providers = response.data.providers;
      const provider = providers.find((p: any) => p.id === this.remoteConfig.provider_id);
      return provider && provider.status === 'active';
    } catch (error) {
      Logger.error("Error checking remote model availability:", error);
      return false;
    }
  }

  async *streamResponse(
    messages: Message[],
    abortController?: AbortController,
    tools?: Tool[]
  ): AsyncGenerator<LLMModelStreamResponse, void, void> {
    const streamIterator = createStreamIterator<LLMModelStreamResponse>();
    try {
      const requestPayload = {
        provider_id: this.remoteConfig.provider_id,
        endpoint: "chat",
        model_key: this.remoteConfig.model,
        messages: messages,
        stream: true,
        ...(tools && tools.length > 0 ? { tools } : {})
      };

      const response = await api.post('/v1/proxy/request', requestPayload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        responseType: 'stream',
        signal: abortController?.signal
      });

      let accumulatedContent = '';
      const toolCallsMap = new Map<string, any>(); // Track tool calls by ID
      let currentToolCallId: string | null = null; // Track the current tool call being streamed

      const processLine = (line: string) => {
        if (!line.startsWith('data: ')) return;
        const data = line.slice(6).trim();

        if (data === '[DONE]') {
          // Emit any remaining tool calls before completing
          this.emitCompletedToolCalls(toolCallsMap, streamIterator);
          streamIterator.complete();
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const choice = parsed.choices?.[0];
          const delta = choice?.delta;
          const finishReason = choice?.finish_reason;

          if (!delta && !finishReason) return;

          // Handle content streaming
          if (delta?.content) {
            accumulatedContent += delta.content;
            streamIterator.push({
              type: 'content_chunk',
              content: accumulatedContent,
              search_results: parsed.search_results || []
            });
          }

          // Handle tool calls streaming
          if (delta?.toolcalls) {
            for (const toolCall of delta.toolcalls) {
              if (toolCall.id && toolCall.id.trim() !== '') {
                // New tool call with ID - create entry
                currentToolCallId = toolCall.id;
                toolCallsMap.set(toolCall.id, {
                  id: toolCall.id,
                  tool_type: toolCall.tool_type || 'function',
                  call: {
                    name: toolCall.call?.name || '',
                    arg: toolCall.call?.arg || ''
                  }
                });
              } else if (currentToolCallId && toolCallsMap.has(currentToolCallId)) {
                // Update existing tool call (continuation of streaming)
                const existingToolCall = toolCallsMap.get(currentToolCallId);
                if (toolCall.call?.name) {
                  existingToolCall.call.name += toolCall.call.name;
                }
                if (toolCall.call?.arg) {
                  existingToolCall.call.arg += toolCall.call.arg;
                }
              }
            }
          }

          // If finish_reason is "tool_calls", emit all tool calls
          if (finishReason === 'tool_calls') {
            this.emitCompletedToolCalls(toolCallsMap, streamIterator);
            streamIterator.complete();
          }

        } catch (error) {
          Logger.error("Failed to parse streaming data", {
            error: error instanceof Error ? error.message : String(error),
            data: data.substring(0, 100)
          });
        }
      }

      // Set up stream handlers
      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n');
        lines.forEach(processLine);
      });

      response.data.on('end', () => {
        // Emit any remaining tool calls when stream ends
        this.emitCompletedToolCalls(toolCallsMap, streamIterator);
        streamIterator.complete();
      });

      response.data.on('error', (error: Error) => {
        Logger.error("Stream error:", error);
        streamIterator.complete();
      });

    } catch (error) {
      Logger.error("Error in remote stream response:", error);
      streamIterator.complete();
    }

    for await (const chunk of streamIterator) {
      yield chunk;
    }
  }

  private emitCompletedToolCalls(toolCallsMap: Map<string, any>, streamIterator: any): void {
    for (const [id, toolCall] of toolCallsMap.entries()) {
      // Emit the tool call regardless of completion status when finish_reason is tool_calls
      streamIterator.push({
        type: 'function_call',
        tool_call: { raw: toolCall }
      });
      toolCallsMap.delete(id); // Remove emitted tool call
    }
  }

  private isToolCallComplete(toolCall: any): boolean {
    // Tool call is complete if it has a name and either no args or valid JSON args
    if (!toolCall.call?.name) return false;

    const args = toolCall.call.arg;
    if (!args) return true; // No args is valid

    try {
      JSON.parse(args);
      return true;
    } catch {
      return false; // Invalid JSON means incomplete
    }
  }

  async structuredResponse<R>(messages: Message[], _grammar: any, tools?: Tool[]): Promise<R> {
    Logger.info('Non-Streaming');
    try {
      const requestPayload = {
        provider_id: this.remoteConfig.provider_id,
        endpoint: "chat",
        model_key: this.remoteConfig.model,
        messages: messages,
        stream: false,
        ...(tools && tools.length > 0 ? { tools } : {})
      };

      const response = await api.post('/v1/proxy/request', requestPayload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const content = response.data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No content received from remote model");
      }

      // Try to parse as JSON for structured response
      try {
        return JSON.parse(content) as R;
      } catch {
        // If not valid JSON, return the content as-is
        return content as R;
      }
    } catch (error) {
      Logger.error("Error in remote structured response:", error);
      throw error;
    }
  }

}