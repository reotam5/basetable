import { and, eq } from 'drizzle-orm';
import { database } from '../database/database.js';
import { agent_to_user_mcp } from '../database/tables/agent.js';
import { mcp, user_mcp } from '../database/tables/mcp.js';
import { AuthHandler } from '../helpers/auth-handler.js';
import { Logger } from '../helpers/custom-logger.js';
import { event, service } from '../helpers/decorators.js';

@service
class MCPService {

  @event('mcp.getAll', 'handle')
  public async getMCPs(filter?: { is_active?: boolean }) {
    try {
      return await database()
        .select()
        .from(user_mcp)
        .where(and(
          eq(user_mcp.user_id, AuthHandler.profile!.sub),
          filter ? eq(user_mcp.is_active, !!filter.is_active) : undefined
        ))
        .leftJoin(
          mcp,
          eq(user_mcp.mcp_id, mcp.id)
        )
    } catch (error) {
      Logger.error("Error fetching MCPs:", error);
      return [];
    }
  }

  @event('mcp.install', 'handle')
  public async installMCP(name: string) {
    try {
      const m = await database()
        .select()
        .from(mcp)
        .where(eq(mcp.name, name))


      const row = await database()
        .update(user_mcp)
        .set({
          is_installed: true,
          is_active: false,
        })
        .where(and(
          eq(user_mcp.user_id, AuthHandler.profile!.sub),
          eq(user_mcp.mcp_id, m[0]?.id)
        ))
      return row.changes > 0;
    } catch (error) {
      Logger.error("Error installing MCP:", error);
      return false;
    }
  }

  @event('mcp.uninstall', 'handle')
  public async uninstallMCP(name: string) {
    try {
      const m = await database()
        .select()
        .from(mcp)
        .where(eq(mcp.name, name))


      const row = await database()
        .update(user_mcp)
        .set({
          is_installed: false,
          is_active: false,
        })
        .where(and(
          eq(user_mcp.user_id, AuthHandler.profile!.sub),
          eq(user_mcp.mcp_id, m[0]?.id)
        ))
        .returning();

      // delete agent MCP associations if they exist
      await database()
        .delete(agent_to_user_mcp)
        .where(
          eq(agent_to_user_mcp.user_mcp_id, row[0]?.id)
        )
      return true
    } catch (error) {
      Logger.error("Error installing MCP:", error);
      return false;
    }
  }

  @event('mcp.setActiveState', 'handle')
  public async setActiveState(name: string, is_active: boolean) {
    try {
      const m = await database()
        .select()
        .from(mcp)
        .where(eq(mcp.name, name))


      const row = await database()
        .update(user_mcp)
        .set({
          is_active,
        })
        .where(and(
          eq(user_mcp.user_id, AuthHandler.profile!.sub),
          eq(user_mcp.mcp_id, m[0]?.id)
        ))
        .returning();

      // delete agent MCP associations if they exist
      await database()
        .delete(agent_to_user_mcp)
        .where(
          eq(agent_to_user_mcp.user_mcp_id, row[0]?.id)
        )
      return true
    } catch (error) {
      Logger.error("Error setting MCP active state:", error);
      return false;
    }
  }
}

const instance = new MCPService();
export { instance as MCPService };


