import { and, eq } from 'drizzle-orm';
import { database } from '../database/database.js';
import { agent_to_mcp_server } from '../database/tables/agent.js';
import { mcp_server } from '../database/tables/mcp-server.js';
import { AuthHandler } from '../helpers/auth-handler.js';
import { Logger } from '../helpers/custom-logger.js';
import { event, service } from '../helpers/decorators.js';
import { mcpClientRegistry } from '../helpers/mcp-client-registry.js';

@service
class MCPService {

  public async getMCP(mcp_server_id: number) {
    try {
      const mcp = await database()
        .select()
        .from(mcp_server)
        .where(and(
          eq(mcp_server.user_id, AuthHandler.profile!.sub),
          eq(mcp_server.id, mcp_server_id)
        ))
        .limit(1);

      return mcp[0] || null;
    } catch (error) {
      Logger.error("Error fetching MCP:", error);
      return null;
    }
  }

  @event('mcp.getAll', 'handle')
  public async getMCPs(filter?: { is_active?: boolean }) {
    try {
      return await database()
        .select()
        .from(mcp_server)
        .where(and(
          eq(mcp_server.user_id, AuthHandler.profile!.sub),
          filter ? eq(mcp_server.is_active, !!filter.is_active) : undefined
        ))
    } catch (error) {
      Logger.error("Error fetching MCPs:", error);
      return [];
    }
  }

  @event('mcp.install', 'handle')
  public async installMCP(mcp_server_id: number) {
    try {
      const row = await database()
        .update(mcp_server)
        .set({
          is_installed: true,
          is_active: true,
        })
        .where(and(
          eq(mcp_server.user_id, AuthHandler.profile!.sub),
          eq(mcp_server.id, mcp_server_id)
        ))

      try {
        await mcpClientRegistry.syncOne(mcp_server_id);
      } catch {
        await database()
          .update(mcp_server)
          .set({
            is_installed: false,
            is_active: false,
          })
          .where(eq(mcp_server.id, mcp_server_id));
        throw new Error("Please make sure the configuration is correct and try again.");
      }

      return row.changes > 0;
    } catch (error) {
      Logger.error("Error installing MCP:", error);
      return false;
    }
  }

  @event('mcp.uninstall', 'handle')
  public async uninstallMCP(mcp_server_id: number) {
    try {
      const mcp = await this.getMCP(mcp_server_id);
      if (mcp?.type === 'custom') {
        await database()
          .delete(mcp_server)
          .where(and(
            eq(mcp_server.user_id, AuthHandler.profile!.sub),
            eq(mcp_server.id, mcp_server_id)
          ))
      } else {
        await database()
          .update(mcp_server)
          .set({
            is_installed: false,
            is_active: false,
          })
          .where(and(
            eq(mcp_server.user_id, AuthHandler.profile!.sub),
            eq(mcp_server.id, mcp_server_id)
          ))
      }


      // delete agent MCP associations if they exist
      await database()
        .delete(agent_to_mcp_server)
        .where(
          eq(agent_to_mcp_server.mcp_server_id, mcp_server_id)
        )

      await mcpClientRegistry.syncOne(mcp_server_id);

      return true
    } catch (error) {
      Logger.error("Error installing MCP:", error);
      return false;
    }
  }

  @event('mcp.setActiveState', 'handle')
  public async setActiveState(mcp_server_id: number, is_active: boolean) {
    try {
      const row = await database()
        .update(mcp_server)
        .set({
          is_active,
        })
        .where(and(
          eq(mcp_server.user_id, AuthHandler.profile!.sub),
          eq(mcp_server.id, mcp_server_id)
        ))
        .returning();


      if (!is_active) {
        // delete agent MCP associations if they exist
        await database()
          .delete(agent_to_mcp_server)
          .where(
            eq(agent_to_mcp_server.mcp_server_id, row[0]?.id)
          )
      }

      try {
        await mcpClientRegistry.syncOne(mcp_server_id);
      } catch {
        await database()
          .update(mcp_server)
          .set({
            is_active: false,
          })
          .where(eq(mcp_server.id, mcp_server_id));
        throw new Error("Please make sure the configuration is correct and try again.");
      }
      return true
    } catch (error) {
      Logger.error("Error setting MCP active state:", error);
      return false;
    }
  }

  @event('mcp.createNew', 'handle')
  public async createNewMCP(data: Omit<typeof mcp_server.$inferInsert, 'type' | 'user_id' | 'is_installed' | 'is_active' | 'name'>) {
    try {
      const existingMCPs = await database()
        .select()
        .from(mcp_server)
        .where(and(
          eq(mcp_server.user_id, AuthHandler.profile!.sub),
          eq(mcp_server.server_config, data.server_config!),
        ));

      if (existingMCPs.length > 0) {
        await this.installMCP(existingMCPs[0].id);
        await this.setActiveState(existingMCPs[0].id, true);
        return existingMCPs[0];
      }

      const [newMCP] = await database()
        .insert(mcp_server)
        .values({
          ...data,
          name: '',
          type: 'custom',
          user_id: AuthHandler.profile!.sub,
          is_installed: true,
          is_active: true,
        })
        .returning();

      try {
        await mcpClientRegistry.syncOne(newMCP.id);
      } catch {
        await this.uninstallMCP(newMCP.id);
        throw new Error("Please make sure the configuration is correct and try again.");
      }

      return this.getMCP(newMCP.id);
    } catch (error) {
      Logger.error("Error creating new MCP:", error);
      throw error;
    }
  }

  @event('mcp.setConfirmationBypass', 'handle')
  public async setConfirmationBypass(mcpServerId: number, toolId: string, bypass: boolean) {
    try {
      const mcp = await this.getMCP(mcpServerId);
      const availableTools = mcp?.available_tools || [];
      const confirmationBypassTools = mcp?.confirmation_bypass_tools || [];

      if (availableTools.findIndex(t => t.id === toolId) === -1) {
        Logger.warn(`Tool with ID ${toolId} not found in available tools for MCP ${mcpServerId}`);
        return false;
      }

      let newConfirmationBypassTools: string[];
      if (bypass) {
        newConfirmationBypassTools = [...confirmationBypassTools, toolId];
      } else {
        newConfirmationBypassTools = confirmationBypassTools.filter(t => t !== toolId);
      }

      await database()
        .update(mcp_server)
        .set({
          confirmation_bypass_tools: newConfirmationBypassTools,
        })
        .where(eq(mcp_server.id, mcpServerId));

      return true;
    } catch (error) {
      Logger.error("Error bypassing confirmation for tool:", error);
      return false;
    }
  }

  @event('mcp.getConfirmationBypass', 'handle')
  public async getConfirmationBypass(mcpServerId: number, toolId: string) {
    try {
      const mcp = await this.getMCP(mcpServerId);
      if (!mcp) {
        Logger.warn(`MCP with ID ${mcpServerId} not found`);
        return false;
      }

      const confirmationBypassTools = mcp.confirmation_bypass_tools || [];
      return confirmationBypassTools.includes(toolId);
    } catch (error) {
      Logger.error("Error fetching confirmation bypass for tool:", error);
      return false;
    }
  }


  /**
   * When available tools changes, this method syncronizes the tools across all agents associated with the MCP.
   */
  public async updateAvailableTools(mcpServerId: number, availableTools: typeof mcp_server.$inferInsert['available_tools']) {
    try {
      await database()
        .update(mcp_server)
        .set({ available_tools: availableTools })
        .where(eq(mcp_server.id, mcpServerId!))
        .returning();

      return true;
    } catch (error) {
      Logger.error("Error updating available tools:", error);
      return false;
    }
  }

  public async getMcpServerByToolId(toolId: string) {
    try {
      const allMCPs = await database()
        .select()
        .from(mcp_server)
        .where(eq(mcp_server.user_id, AuthHandler.profile!.sub));

      for (const mcp of allMCPs) {
        const availableTools = mcp.available_tools || [];

        if (availableTools.some(tool => tool.id === toolId)) {
          return await this.getMCP(mcp.id);
        }
      }
      return null;
    } catch (error) {
      Logger.error("Error fetching MCP by tool ID:", error);
      return null;
    }
  }

  public async updateMcpName(mcpServerId: number, name: string) {
    try {
      const row = await database()
        .update(mcp_server)
        .set({
          name,
        })
        .where(and(
          eq(mcp_server.user_id, AuthHandler.profile!.sub),
          eq(mcp_server.id, mcpServerId)
        ))
        .returning();

      if (row.length > 0) {
        return row[0];
      }
      return null;
    } catch (error) {
      Logger.error("Error updating MCP name:", error);
      return null;
    }
  }
}

const instance = new MCPService();
export { instance as MCPService };


