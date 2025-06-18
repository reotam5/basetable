import { eq } from "drizzle-orm";
import { backend } from "../backend.js";
import { database } from "../database/database.js";
import { chat } from "../database/tables/chat.js";
import { message } from "../database/tables/message.js";
import { AgentService, MessageService, SettingService } from "../services/index.js";
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
  async getAppropriateAgent(prompt: string, mentionedAgentId?: number): Promise<typeof this.mainAgent> {
    console.log('getAppropriateAgent called with mentionedAgentId:', mentionedAgentId);

    // If an agent is mentioned via @ syntax, use that agent directly
    if (mentionedAgentId) {
      const selectedAgent = this.agents.find(agent => agent.id === mentionedAgentId) || this.mainAgent;
      console.log('Using mentioned agent:', selectedAgent.name, 'ID:', selectedAgent.id);
      return selectedAgent;
    }

    // Check if auto-routing is enabled
    const autoRouteSetting = await SettingService.getSetting("agent.autoRoute");
    const isAutoRouteEnabled = autoRouteSetting === "true";

    console.log('Auto-routing enabled:', isAutoRouteEnabled);

    // If auto-routing is disabled, always return the main agent
    if (!isAutoRouteEnabled) {
      console.log('Using main agent (auto-routing disabled)');
      return this.mainAgent;
    }

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

  /**
   * Parse @ mentions from the user prompt
   */
  private parseAgentMentions(prompt: string): { cleanedPrompt: string; mentionedAgentId?: number } {
    let mentionedAgentId: number | undefined;
    let cleanedPrompt = prompt;

    console.log('Parsing mentions from prompt:', prompt);
    console.log('Available agents:', this.agents.map(a => ({ id: a.id, name: a.name })));

    // Try to find agent mentions anywhere in the prompt
    if (prompt.includes('@')) {
      // Find the best matching agent name (check both original and dashed versions)
      let bestMatch: typeof this.agents[0] | null = null;
      let longestMatch = 0;
      let matchedPattern = '';

      for (const agent of this.agents) {
        if (agent.is_main) continue; // Skip main agent

        // Check dashed version first (preferred format)
        const dashedName = agent.name.replace(/\s+/g, '-');
        const dashedPattern = `@${dashedName}`;
        console.log(`Checking dashed pattern: ${dashedPattern} against prompt: ${prompt}`);
        if (prompt.toLowerCase().includes(dashedPattern.toLowerCase())) {
          if (dashedName.length > longestMatch) {
            bestMatch = agent;
            longestMatch = dashedName.length;
            matchedPattern = dashedPattern;
            console.log(`Found match with dashed pattern: ${dashedPattern}`);
          }
        }

        // Also check original name as fallback
        const originalPattern = `@${agent.name}`;
        console.log(`Checking original pattern: ${originalPattern} against prompt: ${prompt}`);
        if (prompt.toLowerCase().includes(originalPattern.toLowerCase())) {
          if (agent.name.length > longestMatch) {
            bestMatch = agent;
            longestMatch = agent.name.length;
            matchedPattern = originalPattern;
            console.log(`Found match with original pattern: ${originalPattern}`);
          }
        }
      }

      if (bestMatch) {
        mentionedAgentId = bestMatch.id;
        // Remove the @ mention from wherever it appears in the prompt
        cleanedPrompt = prompt.replace(matchedPattern, '').trim();
        console.log('Found mention:', matchedPattern);
        console.log('Matched agent:', bestMatch);
        console.log('Using agent ID:', mentionedAgentId, 'Cleaned prompt:', cleanedPrompt);
      } else {
        console.log('No matching agent found for mention');
      }
    }

    return { cleanedPrompt, mentionedAgentId };
  }

  async *processMessage(chatId: number, next_prompt: string, attachedFiles?: any[], longTextDocuments?: Array<{ id: string, content: string, title: string }>, abortController?: AbortController) {
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

    // Parse @ mentions from the message
    console.log('Original prompt for mention parsing:', next_prompt);
    const { cleanedPrompt, mentionedAgentId } = this.parseAgentMentions(next_prompt);
    console.log('Parsed mentionedAgentId:', mentionedAgentId);

    // create a new message in the database (store the original prompt with @ mentions)
    const created_message = await MessageService.createMessage({
      chat_id: chatId,
      content: next_prompt,
      type: 'user',
      status: 'success',
      metadata: {
        longTextDocuments
      }
    });

    accumulatedMessages.push(created_message);

    // format messages into a prompt (use cleaned prompt for LLM)
    const prompt =
      `${accumulatedMessages.slice(0, -1).map(message =>
        `\n<|${message.type}|>\n` +
          `${message.content}` +
          message.metadata?.longTextDocuments?.length ? message.metadata?.longTextDocuments?.map((doc: any) =>
            `\n<|attached document|>\n` +
            `${doc.title ? `${doc.title}\n` : ""}` +
            `${doc?.content}\n`
          )?.join("\n") : ""
      ).join('\n')}\n` +
      `<|user|>\n` +
      `${cleanedPrompt}\n\n` +
      `${created_message.metadata?.longTextDocuments?.map((t: any) =>
        `<|attached document|>\n` +
        `${t.title ? `${t.title}\n` : ""}` +
        `${t?.content}\n`
      ).join("\n") ?? ""}` +
      `<|assistant|>`;


    // select the appropriate agent based on the prompt and mentions
    const agent = await this.getAppropriateAgent(prompt, mentionedAgentId)
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
    let searchResults: any[] = [];

    try {
      for await (const chunk of iterator) {
        fullContent = chunk.content;

        // Capture search results from the first chunk that has them
        if (chunk.search_results && chunk.search_results.length > 0 && searchResults.length === 0) {
          searchResults = chunk.search_results;
        }

        // yield along with agent that was responsible for this response
        yield {
          ...chunk,
          metadata: {
            agent,
            search_results: searchResults.length > 0 ? searchResults : undefined
          }
        };
      }
    } finally {
      // add response to db
      const [assistantMessage] = await database()
        .insert(message)
        .values({
          chat_id: chatId,
          content: fullContent,
          type: 'assistant',
          status: 'success',
          metadata: searchResults.length > 0 ? JSON.stringify({ search_results: searchResults }) as any : null,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning();
      this.chatSessions.get(chatId)?.push(assistantMessage);


    }
  }

  private async generateTitle(prompt: string, chatId: number) {
    const defaultModel = this.llmModelRegistry.getDefaultModel();

    let title = 'New Chat';
    if (defaultModel) {
      const data = await defaultModel.structuredResponse<{ title: string }>(`
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
      title = data.title || title;
    }

    await database()
      .update(chat)
      .set({ title })
      .where(eq(chat.id, chatId))

    backend.getMainWindow()?.windowInstance.webContents.send("chat.titleUpdate", chatId, title)
  }
}

const chatOrchestrator = new ChatOrchestrator();
export { chatOrchestrator };
