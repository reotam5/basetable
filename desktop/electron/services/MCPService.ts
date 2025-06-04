import ApiKey from "../db/models/api-key.model.js";
import MCP from "../db/models/mcp.model.js";
import User_MCP from "../db/models/user-mcp.model.js";
import User from "../db/models/user.model.js";
import { AuthHandler } from "../helpers/AuthHandler.js";
import { event, service } from "../helpers/decorators.js";

@service
export class MCPService {

  @event('mcp.getAll', 'handle')
  public async getMCPs(filter?: { is_active?: boolean }): Promise<any[]> {
    try {
      const whereClause = filter ? { is_active: filter.is_active } : {};

      const mcps = await MCP.findAll({
        include: [
          {
            model: User,
            attributes: ['id'],
            through: {
              attributes: ['id', 'is_active', 'is_installed'],
              where: whereClause,
            },
            where: {
              id: AuthHandler.profile?.sub,
            },
          },
        ]
      });

      const apiKeys: { [x: number]: any[] } = {}
      for (const mcp of mcps) {
        const userMcp = mcp.users?.[0]?.User_MCP.get({ plain: true });
        apiKeys[mcp.id!] = (await ApiKey.findAll({
          where: {
            userId: AuthHandler.profile?.sub,
            userMcpId: userMcp?.id,
          }
        })).map(key => key.get({ plain: true })) || [];
      }

      return mcps.map(mcp => mcp.get({ plain: true })).map(mcpData => ({
        ...mcpData,
        keys: apiKeys[mcpData.id!] || [],
      }))
    } catch (error) {
      console.error("Error fetching MCPs:", error);
      return [];
    }
  }

  @event('mcp.install', 'handle')
  public async installMCP(name: string): Promise<boolean> {
    try {
      const mcp = await MCP.findOne({ where: { name } });

      if (!mcp) {
        console.error(`MCP with name "${name}" not found`);
        return false;
      }

      await User_MCP.upsert({
        userId: AuthHandler.profile!.sub,
        mcpId: mcp.id!,
        is_active: false,
        is_installed: true,
      });

      return true;
    } catch (error) {
      console.error("Error installing MCP:", error);
      return false;
    }
  }

  @event('mcp.uninstall', 'handle')
  public async uninstallMCP(name: string): Promise<boolean> {
    try {
      const mcp = await MCP.findOne({ where: { name } });

      if (!mcp) {
        console.error(`MCP with name "${name}" not found`);
        return false;
      }

      const userMcp = await User_MCP.findOne({
        where: {
          userId: AuthHandler.profile?.sub,
          mcpId: mcp.id,
        }
      });

      if (!userMcp) {
        console.error(`User MCP association not found`);
        return false;
      }

      // Update the user MCP association
      userMcp.is_installed = false;
      userMcp.is_active = false;
      await userMcp.save();

      // Remove agent MCP associations if they exist
      // Note: You might need to import the Agent MCP junction model if it exists
      // For now, I'll use a direct query approach
      const agentMcpModel = userMcp.sequelize?.models['Agents_MCPs'];
      if (agentMcpModel) {
        await agentMcpModel.destroy({
          where: {
            MCPId: userMcp.id,
          }
        });
      }

      return true;
    } catch (error) {
      console.error("Error uninstalling MCP:", error);
      return false;
    }
  }

  @event('mcp.setActiveState', 'handle')
  public async setActiveState(name: string, is_active: boolean): Promise<boolean> {
    try {
      const mcp = await MCP.findOne({ where: { name } });

      if (!mcp) {
        console.error(`MCP with name "${name}" not found`);
        return false;
      }

      const userMcp = await User_MCP.findOne({
        where: {
          userId: AuthHandler.profile?.sub,
          mcpId: mcp.id,
        }
      });

      if (!userMcp) {
        console.error(`User MCP association not found`);
        return false;
      }

      userMcp.is_active = is_active;
      await userMcp.save();

      return true;
    } catch (error) {
      console.error("Error setting MCP active state:", error);
      return false;
    }
  }
}
