import { api } from "./axios-api.js";
import { BaseLLMModel, LLMModelResponseChunk } from "./base-llm-model.js";
import { createStreamIterator } from "./createStreamIterator.js";
import { Logger } from "./custom-logger.js";

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

  async *streamResponse(prompt: string, abortController?: AbortController): AsyncGenerator<LLMModelResponseChunk, void, void> {
    Logger.info('Streaming');
    const streamIterator = createStreamIterator<LLMModelResponseChunk>();

    try {
      const requestPayload = {
        provider_id: this.remoteConfig.provider_id,
        endpoint: "chat",
        model_key: this.remoteConfig.model,
        messages: this.parsePromptToMessages(prompt),
        stream: true
      };

      Logger.info(requestPayload.messages);

      const response = await api.post('/v1/proxy/request', requestPayload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        responseType: 'stream',
        signal: abortController?.signal
      });

      // Parse streaming response
      let content = '';
      const reader = response.data;
      reader.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              streamIterator.complete();
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content || '';
              content += delta
              streamIterator.push({
                type: 'content_chunk',
                delta,
                content: content,
                search_results: parsed.search_results || []
              });
            } catch (e) {
              // Ignore parsing errors for malformed chunks
            }
          }
        }
      });

      reader.on('end', () => {
        streamIterator.complete();
      });

      reader.on('error', (error: Error) => {
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

  async structuredResponse<R>(prompt: string, _grammar: any): Promise<R> {
    Logger.info('Non-Streaming');
    try {
      const requestPayload = {
        provider_id: this.remoteConfig.provider_id,
        endpoint: "chat",
        model_key: this.remoteConfig.model,
        messages: this.parsePromptToMessages(prompt),
        stream: false
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
      } catch (parseError) {
        // If not valid JSON, return the content as-is
        return content as R;
      }
    } catch (error) {
      Logger.error("Error in remote structured response:", error);
      throw error;
    }
  }

  private parsePromptToMessages(prompt: string): Array<{ role: string, content: string }> {
    const messages = [];

    // Split by role markers
    const sections = prompt.split(/<\|(\w+)\|>/);

    for (let i = 1; i < sections.length; i += 2) {
      const role = sections[i];
      const content = sections[i + 1]?.trim();

      if (content && (role === 'system' || role === 'user' || role === 'assistant')) {
        messages.push({
          role: role,
          content: content
        });
      }
    }

    // If no proper role markers found, treat entire prompt as user message
    if (messages.length === 0) {
      messages.push({
        role: 'user',
        content: prompt
      });
    }

    return messages;
  }
}