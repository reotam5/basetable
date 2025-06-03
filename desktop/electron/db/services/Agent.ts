import { ModelCtor } from "sequelize";
import { AuthHandler } from "../../helpers/AuthHandler.js";
import { Logger } from "../../helpers/Logger.js";
import { Database } from "../Database.js";
import { Agents } from "../models/Agents.js";
import { MCPs } from "../models/MCPs.js";
import { Users_MCPs } from "../models/Users_MCPs.js";

class AgentService {
  static #instance: AgentService;
  private model: ModelCtor<any> | undefined = undefined

  private constructor() { }

  public static get instance(): AgentService {
    if (!AgentService.#instance) {
      AgentService.#instance = new AgentService();
    }

    return AgentService.#instance;
  }

  public initialize(): void {
    this.model = Database.sequelize?.model(Agents.name);
  }

  public async deleteAgent(id: number): Promise<boolean> {
    try {
      if (!this.model) {
        throw new Error("Agent model is not initialized.");
      }

      const agent = await this.model.findOne({
        where: { id, userId: AuthHandler.profile?.sub }
      });

      if (!agent) {
        Logger.warn(`Agent with id ${id} not found for user ${AuthHandler.profile?.sub}`);
        return false;
      }

      await agent.setUsers_MCPs([]);
      await agent.setStyles([]);
      await agent.destroy();
      return true;
    } catch {
      return false;
    }
  }

  public async createAgent(agent: {
    instruction: string;
    llmId: number;
    mcpTools?: { [serverId: number]: string[] };
    styles?: number[];
  }): Promise<any | null> {
    try {
      if (!this.model) {
        throw new Error("Agent model is not initialized.");
      }

      const newAgent = await this.model.create({
        name: `Agent ${Date.now()} (we should auto generate this)`,
        instruction: agent.instruction,
        llmId: agent.llmId,
        is_main: false,
        userId: AuthHandler.profile?.sub,
      });

      // Handle MCP tool selections
      const mcpSelections = agent?.mcpTools || {};

      // Add MCP associations with tool selections
      for (const [serverId, selectedTools] of Object.entries(mcpSelections)) {
        const mcpId = parseInt(serverId);
        const mcpModel = await Database.sequelize?.model(Users_MCPs.name).findOne({
          where: { id: mcpId, userId: AuthHandler.profile?.sub },
        });

        if (mcpModel) {
          await newAgent.addUsers_MCPs(mcpModel, {
            through: {
              selected_tools: selectedTools
            }
          });
        }
      }

      // Add styles
      if (agent.styles && agent.styles.length > 0) {
        const styleModels = await Database.sequelize?.model('Styles').findAll({
          where: { id: agent.styles },
        });
        if (styleModels && styleModels.length > 0) {
          await newAgent.addStyles(styleModels);
        }
      }

      return newAgent.get({ plain: true });
    } catch (error) {
      Logger.error("Error creating agent:", error);
      return null;
    }
  }

  public async getAgents(): Promise<any[]> {
    try {
      if (!this.model) {
        throw new Error("Agent model is not initialized.");
      }
      const data = await this.model.findAll({
        where: { userId: AuthHandler.profile?.sub },
        order: [['is_main', 'DESC'], ['createdAt', 'DESC']],
      });
      return data.map(agent => agent.get({ plain: true }));
    } catch {
      return [];
    }
  }

  public async getMainAgent(): Promise<any | null> {
    try {
      if (!this.model) {
        throw new Error("Agent model is not initialized.");
      }
      const data = await this.model.findOne({
        where: { userId: AuthHandler.profile?.sub, is_main: true },
        include: [{
          model: Database.sequelize?.model(Users_MCPs.name),
          attributes: ['id', 'is_active', 'is_installed'],
          through: {
            attributes: ['selected_tools']
          },
          include: [{
            model: Database.sequelize?.model(MCPs.name),
            attributes: ['id', 'name', 'description', 'icon', 'tools'],
          }]
        }, {
          model: Database.sequelize?.model('Styles'),
          attributes: ['id']
        }]
      });
      return data ? data.get({ plain: true }) : null;
    } catch {
      return null;
    }
  }

  public async getAgent(id: number): Promise<any | null> {
    try {
      if (!this.model) {
        throw new Error("Agent model is not initialized.");
      }

      const data = (await this.model.findOne({
        where: { id, userId: AuthHandler.profile?.sub },
        include: [{
          model: Database.sequelize?.model(Users_MCPs.name),
          attributes: ['id', 'is_active', 'is_installed'],
          through: {
            attributes: ['selected_tools']
          },
          include: [{
            model: Database.sequelize?.model(MCPs.name),
            attributes: ['id', 'name', 'description', 'icon', 'tools'],
          }]
        }, {
          model: Database.sequelize?.model('Styles'),
          attributes: ['id']
        }]
      }))?.get({ plain: true })
      return data
    } catch {
      return null;
    }
  }

  public async updateAgent(id: number, agent?: {
    name?: string;
    instruction?: string;
    llmId?: number;
    mcpTools?: { [serverId: number]: string[] };
    styles?: number[];
  }) {
    try {
      if (!this.model) {
        throw new Error("Agent model is not initialized.");
      }

      const agent_db = await this.model.findOne({
        where: { id, userId: AuthHandler.profile?.sub }
      })

      if (agent?.name) agent_db.name = agent.name;
      if (agent?.instruction) agent_db.instruction = agent.instruction;
      if (agent?.llmId) agent_db.llmId = agent.llmId;
      if (agent?.styles) {
        // remove existing styles assiciation
        await agent_db.setStyles([]);
        // add new styles
        const styles = await Database.sequelize?.model('Styles').findAll({
          where: { id: agent.styles },
        });
        if (styles && styles.length > 0) {
          await agent_db.addStyles(styles);
        }
      }

      await agent_db.save();

      // Only update MCP associations if mcpTools is provided
      if (agent?.mcpTools !== undefined) {
        // Clear existing MCP associations
        await agent_db.setUsers_MCPs([]);

        // Handle MCP tool selections
        const mcpSelections = agent.mcpTools;
        if (Object.keys(mcpSelections).length > 0) {
          // Add MCP associations with tool selections
          for (const [serverId, selectedTools] of Object.entries(mcpSelections)) {
            const mcpId = parseInt(serverId);
            const mcp = await Database.sequelize?.model(Users_MCPs.name).findOne({
              where: {
                userId: AuthHandler.profile?.sub,
                mcpId: mcpId
              }
            });

            if (mcp) {
              await agent_db.addUsers_MCPs(mcp, {
                through: {
                  selected_tools: selectedTools
                }
              });
            }
          }
        }
      }

      return await this.getAgent(id);
    } catch (error) {
      Logger.error("Error updating agent:", error);
      return null;
    }
  }
}


const service = AgentService.instance;
export { service as AgentService };
