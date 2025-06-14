import { eq } from "drizzle-orm";
import { backend } from "../backend.js";
import { database } from "../database/database.js";
import { chat } from "../database/tables/chat.js";
import { message } from "../database/tables/message.js";
import { AgentService, MessageService } from "../services/index.js";
import { LLMModelRegistry } from "./llm-model-registry.js";

class ChatOrchestrator {
  private llmModelRegistry!: typeof LLMModelRegistry;
  private agents!: Awaited<ReturnType<typeof AgentService.getAllAgentsWithTools>>;
  private mainAgent!: Awaited<ReturnType<typeof AgentService.getAllAgentsWithTools>>[number];
  private chatSessions!: Map<number, Awaited<ReturnType<typeof MessageService.getMessagesByChatId>>>

  constructor() {
    this.llmModelRegistry = LLMModelRegistry;
    this.chatSessions = new Map();
  }

  async loadLLMModels(): Promise<void> {
    // initialize the LLM model registry. this only needs to be done once
    await this.llmModelRegistry.sync();
  }

  async loadAgents(): Promise<void> {
    // fetch all available agents. this needs to be done whenever agents are updated
    this.agents = await AgentService.getAllAgentsWithTools();
    this.mainAgent = this.agents.find(agent => agent.is_main)!
  }

  /**
   * main agent's llm model will determine the appropriate agent based on message data
   */
  async getAppropriateAgent(prompt: string): Promise<typeof this.mainAgent> {
    const llmModel = this.llmModelRegistry.getModel(this.mainAgent.llm_id.toString());

    const res = await llmModel?.structuredResponse<{ agentId: number }>(
      `<|system|>\n` +
      `You are an agent selector. Each agent has different instruction and tools. Based on the user messages, select the most appropriate agent to process the user request. Return only the agent ID.\n\n` +
      `<|messages|>\n` +
      `${prompt}\n\n` +
      `<|agents|>\n` +
      `${this.agents.map(agent => (
        `<|agent|>\n` +
        `id: ${agent.id}\n` +
        `name: ${agent.name}\n` +
        `instruction: ${agent.instruction}\n` +
        `tools: \n` +
        `${agent.mcps?.map(m => (`- ${m.name} (${m.selectedTools.join(', ')})`)).join('\n')}`
      )).join('\n\n')}\n\n` +
      `<|selected agent id|>`,
      {
        type: 'object',
        properties: {
          agentId: { type: 'number' }
        },
        required: ['agentId']
      }
    )
    return this.agents.find(agent => agent.id === res?.agentId) || this.mainAgent;
  }

  async *processMessage(chatId: number, next_prompt: string, abortController?: AbortController) {
    // if we don't have chat messages cached, fetch them. this only happens once per chat session
    if (!this.chatSessions.has(chatId)) {
      const messages = await MessageService.getMessagesByChatId(chatId);
      this.chatSessions.set(chatId, messages);
    }
    const accumulatedMessages = this.chatSessions.get(chatId)!;

    // if this is a new conversation, we generate title using default llm
    if (accumulatedMessages.length == 0) {
      this.generateTitle(next_prompt, chatId)
    }

    // create a new message in the database
    const created_message = await MessageService.createMessage({
      chat_id: chatId,
      content: next_prompt,
      type: 'user',
      status: 'success',
    });

    accumulatedMessages.push(created_message);

    // format messages into a prompt
    const prompt =
      `${accumulatedMessages.map(message => `\n<|${message.type}|>\n ${message.content}`).join('\n')}\n\n` +
      `<|assistant|>`;

    // select the appropriate agent based on the prompt
    const agent = await this.getAppropriateAgent(prompt)
    const llmModel = this.llmModelRegistry.getModel(agent.llm_id.toString())!;

    // prompt with agent instruction
    const promptWithAgentInstruction =
      `<|system|>\n` +
      `${agent.instruction}\n` +
      `${agent.styles?.length ?
        `\n<|assistant response style|>\n` +
        `${agent.styles.map(style => `${style.name}${style.description ? ` (${style.description})` : ""}`).join(', ')}\n`
        : ""
      }` +
      `${agent.tones?.length ?
        `\n<|assistant response tone|>\n` +
        `${agent.tones.map(tone => `${tone.name}${tone.description ? ` (${tone.description})` : ""}`).join(', ')}\n`
        : ""
      }` +
      `${agent.mcps?.length ?
        `\n<|available assistant tools (mcp servers)|>\n` +
        `${agent.mcps.map(m => (`${m.name} (${m.selectedTools.join(', ')})`)).join('\n')
        }\n`
        : ""
      }` +
      `${prompt}`;

    const iterator = llmModel.streamResponse(promptWithAgentInstruction, abortController);

    let fullContent = '';

    try {
      for await (const chunk of iterator) {
        fullContent = chunk.content;

        // yield along with agent that was responsible for this response
        yield {
          ...chunk,
          metadata: {
            agent
          }
        };
      }
    } finally {
      // add response to db
      const [assistantMessage] = await database()
        .insert(message)
        .values({
          chat_id: chatId,
          type: 'assistant',
          content: fullContent,
          status: 'success',
          metadata: null,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning();

      this.chatSessions.get(chatId)?.push(assistantMessage);


    }
  }

  private async generateTitle(prompt: string, chatId: number) {
    const defaultModel = this.llmModelRegistry.getDefaultModel();
    const { title } = await defaultModel.structuredResponse<{ title: string }>(`
          <|system|>
          summarize user request into a short descriptive title. (sentence of 5-10 words)

          <|user request|>
          ${prompt}

          <|title|>
        `,
      {
        type: 'object',
        properties: {
          title: { type: 'string' }
        },
        required: ['title']
      }
    ) ?? {}

    await database()
      .update(chat)
      .set({ title })
      .where(eq(chat.id, chatId))

    backend.getMainWindow()?.windowInstance.webContents.send("chat.titleUpdate", chatId, title)
  }
}

const chatOrchestrator = new ChatOrchestrator();
export { chatOrchestrator };
