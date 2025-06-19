import { eq } from "drizzle-orm";
import { backend } from "../backend.js";
import { database } from "../database/database.js";
import { chat } from "../database/tables/chat.js";
import { message } from "../database/tables/message.js";
import { AgentService, ChatService, MessageService, SettingService } from "../services/index.js";
import { Logger } from "./custom-logger.js";
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
    // If an agent is mentioned via @ syntax, use that agent directly
    if (mentionedAgentId) {
      const selectedAgent = this.agents.find(agent => agent.id === mentionedAgentId) || this.mainAgent;
      return selectedAgent;
    }

    // Check if auto-routing is enabled
    const autoRouteSetting = await SettingService.getSetting("agent.autoRoute");
    const isAutoRouteEnabled = autoRouteSetting === "true";

    // If auto-routing is disabled, always return the main agent
    if (!isAutoRouteEnabled) {
      return this.mainAgent;
    }

    const llmModel = this.llmModelRegistry.getModel(this.mainAgent.llm_id.toString());

    const res = await llmModel?.structuredResponse<{ agentId: number }>(
      `<|system|>\n` +
      `You are an agent selector. Each agent has different instruction and tools. Based on the user messages, select the most appropriate agent to process the user request. Return only the agent ID.\n\n` +
      `<messages>\n${prompt}\n</messages>\n\n` +
      `<available_agents>\n` +
      `${this.agents.map(agent => (
        `<agent id="${agent.id}" name="${agent.name}">\n` +
        `<instruction>${agent.instruction}</instruction>\n` +
        `${agent.mcps?.length ?
          `<tools>\n${agent.mcps.map(m =>
            `<tool name="${m.name}" capabilities="${m.selectedTools.join(', ')}" />`
          ).join('\n')}\n</tools>`
          : '<tools></tools>'
        }\n` +
        `</agent>`
      )).join('\n')}\n` +
      `</available_agents>`,
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
        if (prompt.toLowerCase().includes(dashedPattern.toLowerCase())) {
          if (dashedName.length > longestMatch) {
            bestMatch = agent;
            longestMatch = dashedName.length;
            matchedPattern = dashedPattern;
          }
        }

        // Also check original name as fallback
        const originalPattern = `@${agent.name}`;
        if (prompt.toLowerCase().includes(originalPattern.toLowerCase())) {
          if (agent.name.length > longestMatch) {
            bestMatch = agent;
            longestMatch = agent.name.length;
            matchedPattern = originalPattern;
          }
        }
      }

      if (bestMatch) {
        mentionedAgentId = bestMatch.id;
        // Remove the @ mention from wherever it appears in the prompt
        cleanedPrompt = prompt.replace(matchedPattern, '').trim();
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
    if (!(await ChatService.getChatById(chatId))?.title) {
      this.generateTitle(next_prompt, chatId)
    }

    // Parse @ mentions from the message
    const { cleanedPrompt, mentionedAgentId } = this.parseAgentMentions(next_prompt);

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
        `\n<|${message.type}|>\n${message.metadata?.longTextDocuments?.length
          ? `<documents>\n${message.metadata.longTextDocuments.map((doc: any) =>
            `<document>\n<title>${doc.title || "Attached Document"}</title>\n<content>${doc?.content}</content>\n</document>`
          ).join('\n')}\n</documents>\n\n`
          : ""
        }${message.content}`
      ).join('')}\n<|user|>\n${created_message.metadata?.longTextDocuments?.length
        ? `<documents>\n${created_message.metadata.longTextDocuments.map((t: any) =>
          `<document>\n<title>${t.title || "Attached Document"}</title>\n<content>${t?.content}</content>\n</document>`
        ).join('\n')}\n</documents>\n\n`
        : ""
      }${cleanedPrompt}\n\n<|assistant|>`;




    // select the appropriate agent based on the prompt and mentions
    const agent = await this.getAppropriateAgent(prompt, mentionedAgentId)
    const llmModel = this.llmModelRegistry.getModel(agent.llm_id.toString())!;
    Logger.debug(`${agent.name} with ${llmModel.getDisplayName()} is processing the message`);

    // prompt with agent instruction
    const promptWithAgentInstruction =
      `<|system|>\n` +
      `${agent.instruction}\n` +
      `${(agent.styles?.length || agent.tones?.length || agent.mcps?.length) ?
        `\n<agent_configuration>\n` +
        `${agent.styles?.length ?
          `<response_styles>\n` +
          `${agent.styles.map(style =>
            `<style name="${style.name}"${style.description ? ` description="${style.description}"` : ""} />`
          ).join('\n')}\n` +
          `</response_styles>\n`
          : ""
        }` +
        `${agent.tones?.length ?
          `<response_tones>\n` +
          `${agent.tones.map(tone =>
            `<tone name="${tone.name}"${tone.description ? ` description="${tone.description}"` : ""} />`
          ).join('\n')}\n` +
          `</response_tones>\n`
          : ""
        }` +
        `${agent.mcps?.length ?
          `<available_tools>\n` +
          `${agent.mcps.map(mcp =>
            `<tool server="${mcp.name}" capabilities="${mcp.selectedTools.join(', ')}" />`
          ).join('\n')}\n` +
          `</available_tools>\n`
          : ""
        }` +
        `</agent_configuration>\n`
        : ""
      }` +
      `${prompt}`;

    const iterator = llmModel.streamResponse(promptWithAgentInstruction, abortController);

    let fullContent = '';
    const metadata: any = {
      agents: [
        {
          name: agent.name,
          llm: {
            displayName: llmModel.getDisplayName(),
          }
        }]
    };

    try {
      for await (const chunk of iterator) {
        fullContent = chunk.content;

        // Capture search results from the first chunk that has them
        if (chunk.search_results && chunk.search_results.length > 0 && !metadata.search_results) {
          metadata.search_results = chunk.search_results;
        }

        // yield along with agent that was responsible for this response
        yield {
          ...chunk,
          metadata: metadata,
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
          metadata: JSON.stringify(metadata) as any,
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
