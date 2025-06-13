import { and, desc, eq } from 'drizzle-orm';
import { database } from '../database/database.js';
import { agent_to_agent_style } from '../database/tables/agent-style.js';
import { agent, agent_to_user_mcp } from '../database/tables/agent.js';
import { api_key } from '../database/tables/api-key.js';
import { user_mcp } from '../database/tables/mcp.js';
import { AuthHandler } from '../helpers/auth-handler.js';
import { Logger } from '../helpers/custom-logger.js';
import { event, service } from '../helpers/decorators.js';

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
        .from(user_mcp)
        .where(and(
          eq(user_mcp.user_id, AuthHandler.profile!.sub),
          eq(user_mcp.is_active, true),
          eq(user_mcp.is_installed, true)
        ))
        .leftJoin(agent_to_user_mcp, eq(user_mcp.id, agent_to_user_mcp.user_mcp_id))

      return {
        ...agent_data,
        styles: styles_data?.map(style => style.agent_style_id) ?? [],
        mcpTools: mcp_data?.reduce((acc, mcp) => {
          acc[mcp.user_mcp.id] = mcp?.agent_to_user_mcp?.selected_tools || [];
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
          name: `Agent ${Date.now()}`, // Ideally, this should be auto-generated or user-defined
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
          .insert(agent_to_user_mcp)
          .values({
            agent_id: newAgent.id,
            user_mcp_id: parseInt(serverId),
            selected_tools: tools
          })
          .onConflictDoUpdate({
            target: [agent_to_user_mcp.agent_id, agent_to_user_mcp.user_mcp_id],
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
      return newAgent;
    } catch (error) {
      Logger.error("Error creating agent:", error);
      return null;
    }
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

      if (data.styles && data.styles.length > 0) {
        // remove existing styles association
        await database()
          .delete(agent_to_agent_style)
          .where(eq(agent_to_agent_style.agent_id, id));

        // add new styles
        await database()
          .insert(agent_to_agent_style)
          .values(data.styles.map(styleId => ({
            agent_id: id,
            agent_style_id: styleId
          })));
      }

      if (data.mcpTools !== undefined) {
        // clear existing mcp associations
        await database()
          .delete(agent_to_user_mcp)
          .where(eq(agent_to_user_mcp.agent_id, id));

        const mcpSelections = data.mcpTools || {};
        for (const [serverId, tools] of Object.entries(mcpSelections)) {
          const mcpId = parseInt(serverId);
          await database()
            .insert(agent_to_user_mcp)
            .values({
              agent_id: id,
              user_mcp_id: mcpId,
              selected_tools: tools
            })
            .onConflictDoUpdate({
              target: [agent_to_user_mcp.agent_id, agent_to_user_mcp.user_mcp_id],
              set: {
                selected_tools: tools
              }
            });
        }
      }
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
          eq(api_key.id, id),
          eq(api_key.user_id, AuthHandler.profile!.sub)
        ))
      return affectedRows.changes > 0;
    } catch (error) {
      Logger.error("Error deleting agent:", error);
      return false;
    }
  }

}

const instance = new AgentService();
export { instance as AgentService };


