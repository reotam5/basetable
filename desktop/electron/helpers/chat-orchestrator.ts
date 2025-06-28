import { eq } from "drizzle-orm";
import { backend } from "../backend.js";
import { database } from "../database/database.js";
import { chat } from "../database/tables/chat.js";
import { mcp_server } from "../database/tables/mcp-server.js";
import { tool_call } from "../database/tables/tool-call.js";
import { AgentService, ChatService, ChatStreamResponseContentChunk, ChatStreamResponseFunctionCallChunk, ChatStreamStartFunctionCall, MCPService, MessageService, SettingService } from "../services/index.js";
import { LLMModelStreamResponse } from "./base-llm-model.js";
import { Logger } from "./custom-logger.js";
import { LLMModelRegistry } from "./llm-model-registry.js";
import { mcpClientRegistry } from "./mcp-client-registry.js";
import { Content, Message, Tool, ToolCall } from "./remote-llm-model.js";

class ChatOrchestrator {
  private llmModelRegistry!: typeof LLMModelRegistry;
  private agents!: Awaited<ReturnType<typeof AgentService.getAllAgentsWithTools>>;
  private mainAgent!: Awaited<ReturnType<typeof AgentService.getAllAgentsWithTools>>[number];

  constructor() {
    this.llmModelRegistry = LLMModelRegistry;
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
   * Build system prompt with agent configuration
   */
  private buildSystemPrompt(agent: typeof this.mainAgent): Content {
    let systemPrompt = agent.instruction;

    if (agent.styles?.length || agent.tones?.length) {
      systemPrompt += '\n\n<agent_configuration>\n';

      if (agent.styles?.length) {
        systemPrompt += '<response_styles>\n';
        systemPrompt += agent.styles.map(style =>
          `<style name="${style.name}"${style.description ? ` description="${style.description}"` : ""} />`
        ).join('\n');
        systemPrompt += '\n</response_styles>\n';
      }

      if (agent.tones?.length) {
        systemPrompt += '<response_tones>\n';
        systemPrompt += agent.tones.map(tone =>
          `<tone name="${tone.name}"${tone.description ? ` description="${tone.description}"` : ""} />`
        ).join('\n');
        systemPrompt += '\n</response_tones>\n';
      }

      systemPrompt += '</agent_configuration>\n';
    }

    return [{
      type: 'text',
      body: systemPrompt
    }];
  }

  /**
   * main agent's llm model will determine the appropriate agent based on message data
   */
  async getAppropriateAgent(messages: Message[], mentionedAgentId?: number): Promise<typeof this.mainAgent> {
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

    // Build selection messages
    const selectionMessages: Message[] = [
      {
        role: 'system',
        content: [{
          type: 'text',
          body: `You are an agent selector. Each agent has different instruction and tools. Based on the user messages, select the most appropriate agent to process the user request. Return only the agent ID.\n\n` +
            `<available_agents>\n` +
            `${this.agents.map(agent => (
              `<agent id="${agent.id}" name="${agent.name}">\n` +
              `<instruction>${agent.instruction}</instruction>\n` +
              `${agent.mcps?.length ?
                `<tools>\n${agent.mcps.map(m =>
                  `<tool name="${m.name}" capabilities="${m.selectedTools?.join(', ')}" />`
                ).join('\n')}\n</tools>`
                : '<tools></tools>'
              }\n` +
              `</agent>`
            )).join('\n')}\n` +
            `</available_agents>`
        }]
      },
      ...messages.filter(m => m.role === 'user')  // Only include user messages for selection
    ];

    const res = await llmModel?.structuredResponse<{ agentId: number }>(
      selectionMessages,
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


  private convertMCPToolsToProxyFormat(mcpTools: Array<{ mcpServerId: number, tool: NonNullable<typeof mcp_server.$inferSelect['available_tools']>[number] }>): Tool[] {
    return mcpTools.map(({ mcpServerId, tool }) => {
      const properties: Record<string, any> = {};

      // Convert each property to ensure it has the required format
      if (tool.inputSchema?.properties && Object.keys(tool.inputSchema.properties).length > 0) {
        for (const [propName, propDef] of Object.entries(tool.inputSchema.properties)) {
          const prop = propDef as any;

          properties[propName] = {
            type: prop.type || 'string',
            description: prop.description || prop.title || '',
            ...(prop.enum ? { enum: prop.enum } : {}),
            ...(prop.default !== undefined ? { default: prop.default } : {})
          };
        }
      } else {
        properties._unused = {
          type: 'string',
          description: 'This parameter is not used',
          default: ''
        };
      }

      // Namespace the tool name with server ID to prevent collisions
      const namespacedToolName = `${mcpServerId}__${tool.name}`;

      return {
        tool_type: 'function',
        tool_definition: {
          name: namespacedToolName,
          description: `[${mcpServerId}] ${tool.description || ''}`,
          parameters: {
            properties,
            required: tool.inputSchema?.required || []
          }
        }
      };
    });
  }


  async *processFunctionCallConfirmation({ id, confirmed, mcp_server_id, function_name, function_args, chat_id }: ChatStreamStartFunctionCall['data'], abortController?: AbortController): AsyncGenerator<LLMModelStreamResponse> {

    let toolCall: typeof tool_call.$inferSelect;

    if (confirmed) {
      let toolCallResponse: Parameters<typeof MessageService.saveToolCallResponse>[1] = {}
      const client = mcpClientRegistry.getClient(mcp_server_id!)
      const executionStartTime = new Date();
      try {
        if (!client) {
          toolCallResponse = {
            content: "This tool cannot be called because the server is not connected.",
            isError: true
          }
        } else {
          toolCallResponse = await client?.callTool({ name: function_name, arguments: function_args ? JSON.parse(function_args) : undefined });
        }
      } catch (error) {
        toolCallResponse = {
          content: `Error calling tool: ${error instanceof Error ? error.message : String(error)}`,
          isError: true
        }
      }
      toolCall = await MessageService.saveToolCallResponse(id, toolCallResponse, executionStartTime, new Date());

    } else {
      toolCall = await MessageService.rejectToolCall(id);
    }

    yield {
      type: 'function_call',
      updated_tool_call: {
        resolved: {
          tool_call: toolCall
        }
      }
    }

    // if tool was rejected, we can stop processing the message
    if (!confirmed) return;


    // if all tool calls are confirmed, we can continue processing the message
    const pendingToolCalls = await MessageService.getPendingToolCalls(chat_id)

    if (!pendingToolCalls?.length) {
      for await (const chunk of this.processMessage(chat_id, undefined, undefined, undefined, abortController)) {
        yield chunk;
      }
    }
  }


  async *processMessage(
    chatId: number,
    next_prompt?: string,
    attachedFiles?: Array<{
      path: string;
      name: string;
    }>,
    longTextDocuments?: Array<{
      id: string,
      content: string,
      title: string
    }>,
    abortController?: AbortController
  ): AsyncGenerator<LLMModelStreamResponse> {

    if (next_prompt) {
      // if this is a new conversation, we generate title using default llm
      if (!(await ChatService.getChatById(chatId))?.title) {
        this.generateTitle(next_prompt, chatId)
      }
    }

    // Get conversation history in proper Message format
    const conversationHistory = await MessageService.getMessagesForBackend(chatId);

    // Parse @ mentions from the message
    const { mentionedAgentId } = next_prompt ? this.parseAgentMentions(next_prompt) : { mentionedAgentId: undefined };

    // select the appropriate agent based on the conversation history
    const agent = await this.getAppropriateAgent(conversationHistory, mentionedAgentId)
    const llmModel = this.llmModelRegistry.getModel(agent.llm_id.toString())!;
    Logger.debug(`${agent.name} with ${llmModel.getDisplayName()} is processing the message`);

    // Get available MCP tools for this agent
    const availableMCPTools = agent?.mcps?.flatMap(mcp => mcp?.selectedTools?.map(tool => ({ mcpServerId: mcp.mcp_server_id, tool: tool })) ?? []) ?? [];
    const proxyTools = this.convertMCPToolsToProxyFormat(availableMCPTools);

    // Build system message with agent configuration
    const systemMessage: Message = {
      role: 'system',
      content: this.buildSystemPrompt(agent)
    };

    // Combine system message with conversation history
    const allMessages: Message[] = [systemMessage, ...conversationHistory];

    const iterator = llmModel.streamResponse(allMessages, abortController, proxyTools);

    let fullContent = '';
    let fullThought = '';
    let fullToolCalls: ToolCall[] = [];

    const metadata: ChatStreamResponseContentChunk['metadata'] = {
      agents: [
        {
          name: agent.name,
          llm: {
            display_name: llmModel.getDisplayName(),
          }
        }]
    };

    try {
      for await (const chunk of iterator) {
        if (chunk.type === 'content_chunk') {
          fullContent = chunk.content;
          fullThought = chunk.thought || fullThought;

          // Capture search results from the first chunk that has them
          if (chunk.search_results && chunk.search_results.length > 0 && !metadata.search_results) {
            metadata.search_results = chunk.search_results;
          }
        }

        // resolve tool calls into more detailed format
        if (chunk.type === 'function_call') {
          const { raw } = chunk.tool_call!;
          fullToolCalls = [...fullToolCalls, raw];
        }

        // defer function call chunk beause we need to create message first
        if (chunk.type !== 'function_call') {
          yield {
            ...chunk,
            metadata: {
              ...(chunk.metadata ?? {}),
              ...metadata,
            }
          };
        }
      }

      const savedToolCalls = await this.saveModelResponseMessages(chatId, fullContent, fullThought, metadata, fullToolCalls);


      if (savedToolCalls?.length) {
        for (const toolCall of savedToolCalls) {
          yield {
            type: 'function_call',
            tool_call: toolCall
          }
        }

        // execute tool calls that are ready to be executed (bypassed user confirmation)
        for (const readyToolCall of savedToolCalls.filter(tc => tc.resolved?.tool_call.status === 'ready_to_be_executed')) {
          for await (const chunk of this.processFunctionCallConfirmation({ ...readyToolCall.resolved!.tool_call, confirmed: true }, abortController)) {
            yield chunk;
          }
        }
      }

    } catch (error) {
      Logger.error("Error in processMessage:", error);
      throw error;
    }
  }

  private async saveModelResponseMessages(chatId: number, fullContent?: string, fullThought?: string, metadata?: any, fullToolCalls?: ToolCall[]) {
    // saves thought message if it exists
    if (fullThought?.trim()) {
      await MessageService.storeThoughtMessage(chatId, fullThought);
    }

    // saves assistant message if it exists
    if (fullContent?.trim()) {
      await MessageService.storeAssistantMessage(chatId, fullContent, metadata);
    }

    const toolCallResolvedChunks: NonNullable<ChatStreamResponseFunctionCallChunk['tool_call']>[] = [];

    // saves tool calls if they exist
    for (const raw of fullToolCalls || []) {

      // example call name: USERMCPID__FUNCTION__NAME
      // we need to extract USERMCPID and FUNCTION__NAME
      const mcpServerId = parseInt(raw.call.name.split('__')[0]);
      const functionName = isNaN(mcpServerId) ? raw.call.name : raw.call.name.split('__').slice(1).join('__');

      // sometimes, llm omits USERMCPID__ prefix, so we need to check if it exists. if they omit, we can still try to look for matching MCP server.
      const mcpServer = isNaN(mcpServerId) ? await MCPService.getMcpServerByToolId(functionName) : await MCPService.getMCP(mcpServerId);

      if (!mcpServer) {
        continue;
      }

      const requireConfirmation = !mcpServer.confirmation_bypass_tools?.includes(functionName)

      const { toolCall } = await MessageService.storeToolCall({
        tool_call_id: raw.id,
        chat_id: chatId,
        mcp_server_id: mcpServer?.id,
        function_name: functionName,
        function_args: raw.call.arg,
        status: requireConfirmation ? 'pending_confirmation' : 'ready_to_be_executed',
        function_return: null, // Will be updated later once executed
        created_at: new Date(),
        updated_at: new Date()
      });

      toolCallResolvedChunks.push({
        raw: raw,
        resolved: {
          tool_call: toolCall,
          mcp_server: mcpServer
        }
      })
    }

    return toolCallResolvedChunks
  }

  private async generateTitle(prompt: string, chatId: number) {
    const defaultModel = this.llmModelRegistry.getDefaultModel();

    let title = 'New Chat';
    if (defaultModel) {
      const titleMessages: Message[] = [
        {
          role: 'system',
          content: [{
            type: 'text',
            body: 'Summarize user request into a short descriptive title. (sentence of 5-10 words)'
          }]
        },
        {
          role: 'user',
          content: [{
            type: 'text',
            body: prompt
          }]
        }
      ];

      try {
        const data = await defaultModel.structuredResponse<{ title: string }>(
          titleMessages,
          {
            type: 'object',
            properties: {
              title: { type: 'string' }
            },
            required: ['title']
          }
        );
        title = data?.title || title;
      } catch (error) {
        Logger.error("Failed to generate title:", error);
      }
    }

    await database()
      .update(chat)
      .set({ title })
      .where(eq(chat.id, chatId));

    backend.getMainWindow()?.windowInstance.webContents.send("chat.titleUpdate", chatId, title);
  }
}

const chatOrchestrator = new ChatOrchestrator();
export { chatOrchestrator };
