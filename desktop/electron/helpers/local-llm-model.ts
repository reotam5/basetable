import { app } from "electron";
import EventEmitter from "events";
import { ChatHistoryItem, ChatModelFunctionCall, ChatModelSegment, ChatSessionModelFunctions, defineChatSessionFunction, getLlama, InsufficientMemoryError, LlamaChatSession, LlamaContext, LlamaContextSequence, LlamaModel } from "node-llama-cpp";
import { join } from "path";
import { BaseLLMModel, LLMModelStreamResponse } from "./base-llm-model.js";
import { createStreamIterator } from "./createStreamIterator.js";
import { Logger } from "./custom-logger.js";
import type { Content, Message, Tool, ToolCall } from "./remote-llm-model.js";

export class LocalLLMModel extends BaseLLMModel {
  private modelPath: string;
  private llama!: Awaited<ReturnType<typeof getLlama>>;
  private _session!: LlamaChatSession;
  private model!: LlamaModel;
  private sequence!: LlamaContextSequence;
  private context!: LlamaContext;
  private sessionQueue: Array<() => void> = [];
  private isSessionBusy = false;
  private sessionReleasedEventEmitter!: EventEmitter;

  constructor(displayName: string, modelPath: string, config: typeof LocalLLMModel.prototype.config = {}, sessionReleasedEventEmitter: EventEmitter) {
    super(displayName, config);
    this.modelPath = modelPath;
    this.sessionReleasedEventEmitter = sessionReleasedEventEmitter;
  }

  async initialize(): Promise<void> { }

  private cleanupSession() {
    setTimeout(async () => {
      await this.context.dispose()
      this._session.dispose({ disposeSequence: true });
      this.isSessionBusy = false;
      this.processNextInQueue();
      this.sessionReleasedEventEmitter.emit('sessionReleased');
    })
  }

  private processNextInQueue() {
    if (this.sessionQueue.length > 0 && !this.isSessionBusy) {
      const nextResolver = this.sessionQueue.shift();
      if (nextResolver) {
        this.isSessionBusy = true;
        nextResolver();
      }
    }
  }

  private async getNewSession(): Promise<LlamaChatSession> {
    try {
      this.llama = await getLlama();
      this.model = await this.llama.loadModel({
        modelPath: join(app.getPath('userData'), 'models', this.modelPath),
      })
      this.context = await this.model.createContext({ contextSize: { min: 512 } });
      this.sequence = this.context.getSequence();
      this._session = new LlamaChatSession({
        contextSequence: this.sequence,
      });
      return this._session;
    } catch (error) {
      if (error instanceof InsufficientMemoryError) {
        return await new Promise(resolve => {
          Logger.warn(`Insufficient memory for model ${this.modelPath}. Waiting for other model session to be released...`);
          this.sessionReleasedEventEmitter.once('sessionReleased', () => {
            resolve(this.getNewSession());
          })
          setTimeout(() => {
            this.sessionReleasedEventEmitter.emit('sessionReleased');
          }, 1000);
        });
      }
      throw new Error(`Failed to create a new session: ${error}`);
    }
  }

  private async takeSession(): Promise<LlamaChatSession> {
    return new Promise<LlamaChatSession>((resolve) => {
      const resolveSession = () => {
        this.getNewSession().then((session) => {
          resolve(session);
        })
      }

      if (!this.isSessionBusy) {
        this.isSessionBusy = true;
        resolveSession();
      } else {
        this.sessionQueue.push(() => {
          resolveSession();
        });
      }
    });
  }


  async *streamResponse(messages: Message[], abortController: AbortController, tools?: Tool[]): AsyncGenerator<LLMModelStreamResponse, void, void> {
    const { currentPrompt, previousMessages } = this.convertMessagesToChatHistory(messages);
    const session = await this.takeSession();
    session.setChatHistory(previousMessages);

    const separateAbortController = new AbortController();
    const streamIterator = createStreamIterator<LLMModelStreamResponse>();
    const onUserAbort = () => {
      separateAbortController.abort('user aborted');
      streamIterator.complete();
    }
    abortController.signal.addEventListener('abort', onUserAbort);
    const toolCalls = new Map<string, { toolCall: ToolCall, isChunkAllGathered: boolean }>();

    try {
      let fullContent = '';
      let fullThought = '';
      session.prompt(currentPrompt, {
        ...this.config,
        signal: separateAbortController?.signal,
        stopOnAbortSignal: true,
        functions: this.convertToolsToFunctions(tools ?? [], toolCalls),
        onResponseChunk: (chunk) => {
          const validToolCalls = Array.from(toolCalls.values()).filter(tc => tc.isChunkAllGathered) ?? [];
          if (validToolCalls.length > 0) {
            for (const { toolCall } of validToolCalls) {
              streamIterator.push({
                type: 'function_call',
                tool_call: {
                  raw: toolCall
                }
              })
            }
            streamIterator.deferredComplete();
            toolCalls.clear();
            separateAbortController?.abort('function call')
            return;
          }

          // skip first empty chunks
          if (!fullContent && !chunk.text.trim()) return;

          if (chunk.segmentType === 'thought') {
            fullThought += chunk.text;
            streamIterator.push({
              type: 'content_chunk',
              thought: fullThought,
              content: fullContent,
            })
          } else {
            if (chunk.text) {
              fullContent += chunk.text;
              streamIterator.push({
                type: 'content_chunk',
                content: fullContent,
                thought: fullThought,
              })
            } else {
              streamIterator.deferredComplete()
            }
          }
        }
      })

      for await (const chunk of streamIterator) {
        yield chunk;
      }
    } catch (error) {
      Logger.error(`Error processing prompt: ${error}`);
      throw error;
    } finally {
      abortController.signal.removeEventListener('abort', onUserAbort);
      this.cleanupSession();
    }
  }

  async structuredResponse(messages: Message[], grammar: any) {
    const { currentPrompt, previousMessages } = this.convertMessagesToChatHistory(messages);
    const session = await this.takeSession();
    session.setChatHistory(previousMessages);

    try {
      const structure = await this.llama.createGrammarForJsonSchema(grammar);
      const res = await session.prompt(`${currentPrompt}`, { grammar: structure });
      return structure.parse(res) as any
    } catch (error) {
      Logger.error(`Error processing structured response: ${error}`);
      throw error;
    } finally {
      this.cleanupSession();
    }
  }


  /**
   * local LLM models are always available. 
   */
  isAvailable() {
    return Promise.resolve(true);
  }

  private convertContentToText(content?: Content): string {
    const textParts = content?.filter(c => c.type === 'text').map(c => c.body).join('\n');
    const imageParts = content?.filter(c => c.type === 'image').map(() => `[user attached image but it is not supported in local LLM]`).join('\n');
    const fileParts = content?.filter(c => c.type === 'file').map(() => `[user attached file but it is not supported in local LLM]`).join('\n');
    return [textParts, imageParts, fileParts].filter(Boolean).join('\n');
  }

  convertMessagesToChatHistory(messages: Message[]) {
    const isLastMessageFromUser = messages.length > 0 && messages[messages.length - 1].role === 'user' && messages[messages.length - 1].content?.some(c => c.type === 'text')
    const prevMessages = isLastMessageFromUser ? messages.slice(0, -1) : messages;

    return {
      previousMessages: prevMessages.map(msg => {
        if (msg.role === 'system') {
          return {
            type: 'system',
            text: this.convertContentToText(msg.content),
          }
        } else if (msg.role === 'user') {
          return {
            type: 'user',
            text: this.convertContentToText(msg.content),
          }
        } else if (msg.role === 'assistant') {
          const toolCalls = msg?.tool_calls?.map(c => ({
            name: c?.call?.name,
            params: c?.call?.arg,
            type: 'functionCall',
            result: messages?.find(m => m.role === 'user' && m.content?.some(content => content.tool_call_id === c.id))?.content?.find(content => content.tool_call_id === c.id)?.body || '',
          } as ChatModelFunctionCall)) ?? [];

          const thoughts: ChatModelSegment[] = msg.content?.filter(c => c.type === 'think').map(c => ({
            type: 'segment',
            text: c.body,
            segmentType: 'thought',
            ended: true,
          })) ?? []

          const modelResponse = {
            type: 'model',
            response: [
              ...thoughts,
              this.convertContentToText(msg.content),
              ...toolCalls,
            ].filter(Boolean)
          } as ChatHistoryItem;

          return modelResponse
        }
        return null
      }).filter(msg => msg !== null) as ChatHistoryItem[] ?? [],
      currentPrompt: isLastMessageFromUser ? this.convertContentToText(messages[messages.length - 1].content) : "If you have the answer to my request, please respond with the answer. You can also continue the conversation if you need more information.",
    }
  }

  convertToolsToFunctions(tools: Tool[], toolCalls: Map<string, { toolCall: ToolCall; isChunkAllGathered: boolean; }>): ChatSessionModelFunctions {
    return tools?.reduce((acc, tool) => {
      const params = Object.entries(tool.tool_definition.parameters.properties ?? {}).reduce((paramsAcc, [key, value]) => {
        if (key === '_unused') return paramsAcc;

        let property = {};
        const isEnum = value.enum && value.enum.length > 0;
        const isRequired = tool.tool_definition.parameters.required?.includes(key);
        if (isEnum) {
          property = {
            enum: value.enum,
          }
        } else {
          property = {
            type: value.type || 'string',
          }
        }
        if (!isRequired) {
          property = {
            oneOf: [
              { type: 'null' },
              property
            ]
          }
        }

        return {
          ...paramsAcc,
          [key]: {
            ...property,
            ...(value.description ? { description: value.description } : {}),
          }
        }
      }, {} as ChatSessionModelFunctions[string]['params'])

      return {
        ...acc,
        [tool.tool_definition.name]: defineChatSessionFunction({
          handler: (arg) => {
            const randomId = Math.random().toString(36).substring(2, 15);
            toolCalls.set(
              randomId,
              {
                toolCall: {
                  id: randomId,
                  tool_type: 'function',
                  call: {
                    name: tool.tool_definition.name,
                    arg: JSON.stringify(arg || {})
                  }
                },
                isChunkAllGathered: true
              }
            )
          },
          description: tool.tool_definition.description,
          ...(Object.keys(params).length > 0 ? {
            params: {
              type: 'object',
              properties: params
            }
          } : {}),
        })
      } as ChatSessionModelFunctions;
    }, {} as ChatSessionModelFunctions) || {};
  }
}