import { and, desc, eq } from 'drizzle-orm';
import { backend } from '../backend.js';
import { database } from '../database/database.js';
import { agent_style, agent_to_agent_style } from '../database/tables/agent-style.js';
import { agent, agent_to_mcp_server } from '../database/tables/agent.js';
import { mcp_server } from '../database/tables/mcp-server.js';
import { AuthHandler } from '../helpers/auth-handler.js';
import { chatOrchestrator } from '../helpers/chat-orchestrator.js';
import { Logger } from '../helpers/custom-logger.js';
import { event, service } from '../helpers/decorators.js';
import { LLMModelRegistry } from '../helpers/llm-model-registry.js';

@service
class AgentService {
  @event('agent.getMain', 'handle')
  public async getMainAgent() {
    try {
      const [mainAgent] = await database()
        .select()
        .from(agent)
        .where(and(
          eq(agent.user_id, AuthHandler.profile!.sub),
          eq(agent.is_main, true)
        ))
      return mainAgent
    } catch (error) {
      Logger.error("Error fetching main agent:", error);
      return null;
    }
  }

  @event('agent.getAll', 'handle')
  public async getAllAgents() {
    try {
      return await database()
        .select()
        .from(agent)
        .where(eq(agent.user_id, AuthHandler.profile!.sub))
        .orderBy(
          desc(agent.is_main),
          desc(agent.created_at)
        )
    } catch (error) {
      Logger.error("Error fetching agents:", error);
      return [];
    }
  }

  public async getAllAgentsWithTools() {
    try {
      const agents = await this.getAllAgents();
      const toolMap = new Map<number, { mcp_server_id: number; name: string; description: string; selectedTools: typeof mcp_server.$inferSelect['available_tools'] }[]>();
      const styleMap = new Map<number, { name: string; description?: string }[]>();
      const toneMap = new Map<number, { name: string; description?: string }[]>();

      for (const agent of agents) {
        const mcpTools = await database()
          .select()
          .from(agent_to_mcp_server)
          .leftJoin(mcp_server, eq(agent_to_mcp_server.mcp_server_id, mcp_server.id))
          .where(eq(agent_to_mcp_server.agent_id, agent.id));


        const styles = await database()
          .select()
          .from(agent_to_agent_style)
          .leftJoin(agent_style, eq(agent_style.id, agent_to_agent_style.agent_style_id))
          .where(eq(agent_to_agent_style.agent_id, agent.id));

        toolMap.set(agent.id, mcpTools.map(tool => ({
          mcp_server_id: tool.agent_to_mcp_server.mcp_server_id,
          name: tool.mcp_server!.name,
          description: tool.mcp_server!.description ?? "",
          selectedTools: tool.agent_to_mcp_server?.selected_tools?.map(toolId => tool.mcp_server!.available_tools!.find(t => t.id == toolId) ?? { id: "", name: "" }).filter(t => t.id) ?? [],
        })).filter(tool => tool.selectedTools.length > 0));

        styleMap.set(agent.id, styles?.filter(s => s.agent_style?.type == 'style').map(style => ({ name: style.agent_style!.name, description: style.agent_style?.description })) ?? [])
        toneMap.set(agent.id, styles?.filter(s => s.agent_style?.type == 'tone').map(style => ({ name: style.agent_style!.name, description: style.agent_style?.description })) ?? [])
      }

      return agents.map(agent => ({
        ...agent,
        mcps: toolMap.get(agent.id) || [],
        styles: styleMap.get(agent.id) || [],
        tones: toneMap.get(agent.id) || []
      }))
    } catch (error) {
      Logger.error("Error fetching agents with tools:", error);
      return [];
    }
  }

  @event('agent.getById', 'handle')
  public async getAgentById(id: number) {
    try {
      const [agent_data] = await database()
        .select()
        .from(agent)
        .where(and(
          eq(agent.id, id),
          eq(agent.user_id, AuthHandler.profile!.sub)
        ))

      const styles_data = await database()
        .select()
        .from(agent_to_agent_style)
        .where(eq(agent_to_agent_style.agent_id, id))

      const mcp_data = await database()
        .select()
        .from(agent_to_mcp_server)
        .leftJoin(mcp_server, eq(mcp_server.id, agent_to_mcp_server.mcp_server_id))
        .where(and(
          eq(mcp_server.is_active, true),
          eq(mcp_server.is_installed, true),
          eq(agent_to_mcp_server.agent_id, id)
        ))

      return {
        ...agent_data,
        styles: styles_data?.map(style => style.agent_style_id) ?? [],
        mcpTools: mcp_data?.reduce((acc, mcp) => {
          if (mcp?.agent_to_mcp_server?.selected_tools?.length === 0) return acc;
          acc[mcp.mcp_server!.id] = mcp?.agent_to_mcp_server?.selected_tools || [];
          return acc;
        }, {} as { [serverId: number]: string[] }) || {}
      }
    } catch (error) {
      Logger.error("Error fetching agent by ID:", error);
      return null;
    }
  }


  @event('agent.create', 'handle')
  public async createAgent(data: {
    instruction: string;
    llmId: number;
    mcpTools?: { [serverId: number]: string[] };
    styles?: number[];
  }) {
    try {
      const [newAgent] = await database()
        .insert(agent)
        .values({
          name: ``,
          instruction: data.instruction,
          llm_id: data.llmId,
          user_id: AuthHandler.profile!.sub,
          is_main: false,
        })
        .returning();

      // create agent_to_user_mcp (this will upsert selected tools)
      const mcpSelections = data.mcpTools || {};
      for (const [serverId, tools] of Object.entries(mcpSelections)) {
        await database()
          .insert(agent_to_mcp_server)
          .values({
            agent_id: newAgent.id,
            mcp_server_id: parseInt(serverId),
            selected_tools: tools
          })
          .onConflictDoUpdate({
            target: [agent_to_mcp_server.agent_id, agent_to_mcp_server.mcp_server_id],
            set: {
              selected_tools: tools
            }
          })
      }

      // create agent styles
      if (data.styles && data.styles.length > 0) {
        await database()
          .insert(agent_to_agent_style)
          .values([
            ...data.styles.map(styleId => ({
              agent_id: newAgent.id,
              agent_style_id: styleId
            }))
          ])
      }

      this.updateAgentName(newAgent.id);

      return newAgent;
    } catch (error) {
      Logger.error("Error creating agent:", error);
      return null;
    }
  }

  public async updateAgentName(id: number) {
    const mcpTools = await database()
      .select()
      .from(agent_to_mcp_server)
      .where(eq(agent_to_mcp_server.agent_id, id))
      .leftJoin(mcp_server, eq(mcp_server.id, agent_to_mcp_server.mcp_server_id));

    const existing_agent = await this.getAgentById(id);

    let name = 'New Agent'
    const defaultModel = LLMModelRegistry.getDefaultModel();
    if (defaultModel) {
      const data = await defaultModel.structuredResponse<{ name: string }>([
        {
          role: 'system',
          content: [{ type: 'text', body: 'Given the agent\'s instruction and its available tools, generate a descriptive name for the agent. (Title Case 5 - 10 Words, Ending With Agent)' }]
        },
        {
          role: 'user',
          content: [{ type: 'text', body: `Instruction: ${existing_agent?.instruction}\n\nTools: ${mcpTools.map(tool => `name: ${tool?.mcp_server?.name}\n description: ${tool?.mcp_server?.description}\n capabilities: ${tool.agent_to_mcp_server.selected_tools?.map(t => tool.mcp_server?.available_tools?.find(m => m.id == t)?.name).join(', ')}\n`)}` }]
        }
      ],
        {
          type: 'object',
          properties: {
            name: { type: 'string' }
          },
          required: ['name']
        }
      )
      name = data.name;
    }

    const [updatedAgent] = await database()
      .update(agent)
      .set({ name })
      .where(eq(agent.id, id))
      .returning();

    backend.getMainWindow()?.windowInstance.webContents.send('agent.nameUpdate', updatedAgent.id, updatedAgent.name);

    await chatOrchestrator.loadAgents();
  }

  @event('agent.update', 'handle')
  public async updateAgent(id: number, data: {
    name?: string;
    instruction?: string;
    llmId?: number;
    mcpTools?: { [serverId: number]: string[] };
    styles?: number[];
  }) {
    try {
      if (data.name != undefined || data.instruction != undefined || data.llmId != undefined) {
        await database()
          .update(agent)
          .set({
            ...(data.name != undefined ? {
              name: data.name
            } : {}),
            ...(data.instruction != undefined ? {
              instruction: data.instruction
            } : {}),
            ...(data.llmId != undefined ? {
              llm_id: data.llmId
            } : {}),
          })
          .where(and(
            eq(agent.id, id),
            eq(agent.user_id, AuthHandler.profile!.sub)
          ));
      }

      if (data.styles) {
        // remove existing styles association
        await database()
          .delete(agent_to_agent_style)
          .where(eq(agent_to_agent_style.agent_id, id));

        if (data.styles.length > 0) {
          // add new styles
          await database()
            .insert(agent_to_agent_style)
            .values(data.styles.map(styleId => ({
              agent_id: id,
              agent_style_id: styleId
            })));
        }
      }

      if (data.mcpTools !== undefined) {
        // clear existing mcp associations
        await database()
          .delete(agent_to_mcp_server)
          .where(eq(agent_to_mcp_server.agent_id, id));

        const mcpSelections = data.mcpTools || {};
        for (const [serverId, tools] of Object.entries(mcpSelections)) {
          const mcpId = parseInt(serverId);
          await database()
            .insert(agent_to_mcp_server)
            .values({
              agent_id: id,
              mcp_server_id: mcpId,
              selected_tools: tools
            })
            .onConflictDoUpdate({
              target: [agent_to_mcp_server.agent_id, agent_to_mcp_server.mcp_server_id],
              set: {
                selected_tools: tools
              }
            });
        }
      }
      await chatOrchestrator.loadAgents();
      return true
    } catch (error) {
      Logger.error("Error updating agent:", error);
      return false;
    }
  }

  @event('agent.delete', 'handle')
  public async deleteAgent(id: number) {
    try {
      const affectedRows = await database()
        .delete(agent)
        .where(and(
          eq(agent.id, id),
          eq(agent.user_id, AuthHandler.profile!.sub)
        ))

      await chatOrchestrator.loadAgents();
      return affectedRows.changes > 0;
    } catch (error) {
      Logger.error("Error deleting agent:", error);
      return false;
    }
  }

}

const instance = new AgentService();
export { instance as AgentService };


