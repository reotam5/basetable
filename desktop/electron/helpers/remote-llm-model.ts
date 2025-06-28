import { api } from "./axios-api.js";
import { BaseLLMModel, LLMModelStreamResponse } from "./base-llm-model.js";
import { createStreamIterator } from "./createStreamIterator.js";
import { Logger } from "./custom-logger.js";


// The API should be stable now with all the features we need (thinking, tool calls, multimodal)
// tool here refers to a tool result, you would pass a tool result with role user and a tool part
// for text-based files (code, .txt, .html, markdown, .csv, etc.) we can extract the text from the file and pass it as a text part with the user message
// for pdf files, pass it as a file part with base64 encoded content
// for images, pass it as an image part with base64 encoded content and media_type
// for tool results, pass it as a tool part with tool_call_id
export type PartType = 'text' | 'think' | 'tool' | 'file' | 'image'
export type MediaType = 'jpeg' | 'png' | 'gif' | 'webp'
export type Part = {
  type: PartType;
  body: string;
  media_type?: MediaType; // Only for image parts
  tool_call_id?: string; // Only for tool parts
}

export type Content = Part[];

// Message.content and Delta.content are now an array of parts instead of a single string since users and models can send requests/responses with multiple parts
// example 1: a reasoning model can think first before it gives a final answer
// so the first part in the content of a message/delta would be a think part, and the second part (final answer) would be a text part
// example 2: users can upload multiple files like pdf and image, and a question (attach a pdf and an image and ask a question)
// so the first part would be a file part for the the pdf, and the second part would be an image part, and the final part would be a text part for the question
export interface Message {
  // the most accurate way to represent the role of a message is to use the actual entity the message comes from
  // so ideally there should be only 3 roles: user, assistant, and system
  role: 'system' | 'user' | 'assistant';
  content: Content;
  tool_calls?: ToolCall[];
}


// Same as Message, but for the streaming response
export type Delta = {
  role: string;
  content: Content;
  // This is tools the assistant wants to call
  tool_calls?: ToolCall[];
}


// Same as before
export type ToolCall = {
  id: string;
  tool_type: string;
  call: {
    name: string;
    arg: string;
  };
}

export type Request = {
  provider_id: string;
  endpoint: string;
  model_key: string;
  messages: Message[];
  stream: boolean;
  tools?: Tool[];
  // tool_choice?: ToolChoice; we don't need this right now, but this could be to enable plan mode as we mentioned earlier
}

// we don't need this right now
// // none - no tool call (plan mode)
// // auto - llm decides
// // function - must call a defined tool
// export type ToolChoiceType = 'none' | 'auto' | 'function' 
// export type ToolChoice = {
//   type : ToolChoiceType;
//   function_name?: string; // Only for function choices
// }


// Same as before
export type Response = {
  provider: string; // provider name (e.g. OpenAI)
  model: string;
  choices: Choice[];
  search_results: SearchResult[];
}


// Same as before but with enum for finish_reason
export type Choice = {
  index: number;
  message: Message;
  delta: Delta;
  // tool_calls means the model decided to call a tool
  // stop means the model decided to stop the conversation
  // length means the model decided to stop the conversation because the output reached the max token limit
  finish_reason: 'tool_calls' | 'stop' | 'length';
}

// Same as before
export type SearchResult = {
  title: string;
  url: string;
}


// Same as before
export type ParameterProperty = {
  type: string;
  description: string;
  enum?: string[];
  default?: any;
}

// Same as before
export type ParameterSchema = {
  properties: Record<string, ParameterProperty>;
  required: string[];
}

// Same as before
export type ToolDefinition = {
  name: string;
  description: string;
  parameters: ParameterSchema;
}

// Same as before
export type Tool = {
  tool_type: string;
  tool_definition: ToolDefinition;
}

export type RemoteLLMConfig = {
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

      let fullContent = '';
      let fullThought = '';
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
          // I don't think this is how it should be done but it works for now
          if (delta?.content && Array.isArray(delta.content)) {
            // Merge delta content into accumulated content
            for (const deltaPart of delta.content) {
              if (deltaPart.type === 'text') {
                fullContent += deltaPart.body;
              } else if (deltaPart.type === 'think') {
                fullThought += deltaPart.body;
              } else {
                Logger.warn(`unexpected part type ${deltaPart.type}. Ignoring it.`);
              }

              streamIterator.push({
                type: 'content_chunk',
                content: fullContent,
                thought: fullThought,
                search_results: parsed.search_results || []
              });
            }
          }

          // Handle tool calls streaming
          if (delta?.tool_calls) {
            for (const toolCall of delta.tool_calls) {
              if (toolCall.id && toolCall.id.trim() !== '' && toolCall.call && toolCall.call.name.trim() !== '') {
                // New tool call with ID and tool name - create entry, args will be streamed in subsequent chunks
                currentToolCallId = toolCall.id;
                toolCallsMap.set(toolCall.id, {
                  id: toolCall.id,
                  tool_type: toolCall.tool_type || 'function',
                  call: {
                    name: toolCall.call.name,
                    arg: toolCall.call?.arg || ''
                  }
                });
              } else if (currentToolCallId && toolCallsMap.has(currentToolCallId)) {
                // Update existing tool call (continuation of streaming)
                const existingToolCall = toolCallsMap.get(currentToolCallId);
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

    } catch {
      Logger.error("Error in remote stream response");
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