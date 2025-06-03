import { ModelCtor } from "sequelize";
import { AuthHandler } from "../../helpers/AuthHandler.js";
import { Database } from "../Database.js";
import { Agents_MCPs } from "../models/Agents_MCPs.js";
import { APIKeys } from "../models/APIKeys.js";
import { MCPs } from "../models/MCPs.js";
import { Users } from "../models/Users.js";
import { Users_MCPs } from "../models/Users_MCPs.js";

class MCPService {
  static #instance: MCPService;
  private model: ModelCtor<any> | undefined = undefined

  private constructor() { }

  public static get instance(): MCPService {
    if (!MCPService.#instance) {
      MCPService.#instance = new MCPService();
    }

    return MCPService.#instance;
  }

  public initialize(): void {
    this.model = Database.sequelize?.model(MCPs.name);
  }

  public async getMCPs(filter?: { is_active?: boolean }): Promise<any[]> {
    try {
      if (!this.model) {
        throw new Error("MCP model is not initialized.");
      }
      const mcpList = await this.model.findAll({
        include: [{
          model: Database.sequelize?.model(Users.name),
          attributes: ['id'],
          through: {
            attributes: ['is_active', 'is_installed'],
            where: filter ? { is_active: filter.is_active } : {}
          },
          where: {
            id: AuthHandler.profile?.sub,
          }
        }, {
          model: Database.sequelize?.model(APIKeys.name),
        }]
      });
      const mcps = mcpList.map(mcp => mcp.get({ plain: true }));
      return mcps.map(mcp => ({
        id: mcp.id,
        name: mcp.name,
        description: mcp.description,
        tools: mcp.tools,
        icon: mcp.icon,
        is_active: mcp.Users[0]?.Users_MCPs?.is_active,
        is_installed: mcp.Users[0]?.Users_MCPs?.is_installed,
        keys: mcp.APIKeys
      }));
    } catch {
      return []
    }
  }

  public async installMCP(name: string): Promise<any> {
    try {
      if (!this.model) {
        throw new Error("MCP model is not initialized.");
      }
      const mcp = Database.sequelize?.model(MCPs.name);
      const existingMCP = await mcp?.findOne({ where: { name } });
      if (!existingMCP) {
        return false;
      }

      const user_mcp = Database.sequelize?.model(Users_MCPs.name);
      return await user_mcp?.upsert({
        UserId: AuthHandler.profile?.sub,
        MCPId: existingMCP.get("id"),
        is_active: false,
        is_installed: true,
      })
    } catch {
      return false;
    }
  }

  public async uninstallMCP(name: string): Promise<any> {
    try {
      if (!this.model) {
        throw new Error("MCP model is not initialized.");
      }

      const mcp = Database.sequelize?.model(MCPs.name);
      const existingMCP = await mcp?.findOne({ where: { name } });
      if (!existingMCP) {
        return false;
      }

      const user_mcp = Database.sequelize?.model(Users_MCPs.name);
      const existingEntry = await user_mcp?.findOne({
        where: {
          UserId: AuthHandler.profile?.sub,
          MCPId: existingMCP.get("id"),
        }
      })
      if (!existingEntry) {
        return false;
      }
      existingEntry.set("is_installed", false);
      existingEntry.set("is_active", false);
      await existingEntry.save();

      // remove agents_mcps associations
      await Database.sequelize?.model(Agents_MCPs.name).destroy({
        where: {
          MCPId: existingEntry.get("id"),
        }
      });
      return true;
    } catch {
      return false;
    }
  }

  public async setActiveState(name: string, is_active: boolean): Promise<any> {
    try {
      if (!this.model) {
        throw new Error("MCP model is not initialized.");
      }

      const mcp = Database.sequelize?.model(MCPs.name);
      const existingMCP = await mcp?.findOne({ where: { name } });
      if (!existingMCP) {
        return false;
      }

      const user_mcp = Database.sequelize?.model(Users_MCPs.name);
      const existingEntry = await user_mcp?.findOne({
        where: {
          UserId: AuthHandler.profile?.sub,
          MCPId: existingMCP.get("id"),
        }
      })
      if (!existingEntry) {
        return false;
      }
      existingEntry.set("is_active", is_active);
      return await existingEntry.save();
    } catch {
      return false;
    }
  }
}

const mcpService = MCPService.instance;
export { mcpService as MCPService };

