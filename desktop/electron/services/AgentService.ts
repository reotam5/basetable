import Agent from "../db/models/agent.model.js";
import MCP from "../db/models/mcp.model.js";
import Style from "../db/models/style.model.js";
import User_MCP from "../db/models/user-mcp.model.js";
import { AuthHandler } from "../helpers/AuthHandler.js";
import { event, service } from "../helpers/decorators.js";

@service
export class AgentService {

  @event('agent.delete', 'handle')
  public async deleteAgent(id: number): Promise<boolean> {
    try {
      const agent = await Agent.findOne({
        where: { id, userId: AuthHandler.profile?.sub }
      });

      if (!agent) {
        return false
      }

      await agent.destroy();
      return true;
    } catch {
      return false;
    }
  }

  @event('agent.create', 'handle')
  public async createAgent(agent: {
    instruction: string;
    llmId: number;
    mcpTools?: { [serverId: number]: string[] };
    styles?: number[];
  }): Promise<any | null> {
    try {
      const newAgent = await Agent.create({
        name: `Agent ${Date.now()}`, // Ideally, this should be auto-generated or user-defined
        instruction: agent.instruction,
        llmId: agent.llmId,
        userId: AuthHandler.profile!.sub,
        is_main: false,
      });

      const mcpSelections = agent.mcpTools || {};
      for (const [serverId, tools] of Object.entries(mcpSelections)) {
        const mcpId = parseInt(serverId);
        const mcp = await User_MCP.findOne({
          where: {
            userId: AuthHandler.profile!.sub,
            id: mcpId
          }
        })

        if (mcp) {
          await newAgent.$add('userMcps', mcp, {
            through: {
              selected_tools: tools
            }
          })
        }
      }

      if (agent.styles && agent.styles.length > 0) {
        const styles = await Style.findAll({
          where: { id: agent.styles },
        })
        if (styles && styles.length > 0) {
          await newAgent.$add('styles', styles);
        }
      }

      return newAgent.get({ plain: true });
    } catch (error) {
      console.error("Error creating agent:", error);
      return null;
    }
  }

  @event('agent.getAll', 'handle')
  public async getAllAgents(): Promise<any[]> {
    try {
      const agents = await Agent.findAll({
        where: { userId: AuthHandler.profile?.sub },
        order: [['is_main', 'DESC'], ['createdAt', 'DESC']],
      });

      return agents.map(agent => agent.get({ plain: true }));
    } catch (error) {
      console.error("Error fetching agents:", error);
      return [];
    }
  }

  @event('agent.getMain', 'handle')
  public async getMainAgent(): Promise<any | null> {
    try {
      const mainAgent = await Agent.findOne({
        where: {
          userId: AuthHandler.profile?.sub,
          is_main: true
        },
        include: [
          {
            model: User_MCP,
            attributes: ['id', 'is_active', 'is_installed'],
            through: {
              attributes: ['selected_tools']
            },
            include: [
              {
                model: MCP,
                attributes: ['id', 'name', 'description', 'icon', 'tools'],
              }
            ]
          },
          {
            model: Style,
            attributes: ['id']
          }
        ]
      });

      return mainAgent ? mainAgent.get({ plain: true }) : null;
    } catch (error) {
      console.error("Error fetching main agent:", error);
      return null;
    }
  }

  @event('agent.getById', 'handle')
  public async getAgentById(id: number): Promise<any | null> {
    try {
      const agent = await Agent.findOne({
        where: { id, userId: AuthHandler.profile?.sub },
        include: [
          {
            model: User_MCP,
            attributes: ['id', 'is_active', 'is_installed'],
            through: {
              attributes: ['selected_tools']
            },
            include: [
              {
                model: MCP,
                attributes: ['id', 'name', 'description', 'icon', 'tools'],
              }
            ]
          },
          {
            model: Style,
            attributes: ['id']
          }
        ]
      });

      return agent ? agent.get({ plain: true }) : null;
    } catch (error) {
      console.error("Error fetching agent by ID:", error);
      return null;
    }
  }

  @event('agent.update', 'handle')
  public async updateAgent(id: number, agent: {
    name?: string;
    instruction?: string;
    llmId?: number;
    mcpTools?: { [serverId: number]: string[] };
    styles?: number[];
  }): Promise<any | null> {
    try {
      const agent_db = await Agent.findOne({
        where: { id, userId: AuthHandler.profile?.sub }
      })

      if (!agent_db) {
        return null;
      }

      if (agent?.name) agent_db.name = agent.name;
      if (agent?.instruction) agent_db.instruction = agent.instruction;
      if (agent?.llmId) agent_db.llmId = agent.llmId;
      if (agent?.styles) {
        // remove existing styles assiciation
        await agent_db.$set('styles', []);

        // add new styles
        const styles = await Style.findAll({
          where: { id: agent.styles },
        });
        if (styles && styles.length > 0) {
          await agent_db.$add('styles', styles);
        }
      }

      await agent_db.save();

      // Only update MCP associations if mcpTools is provided
      if (agent?.mcpTools !== undefined) {
        // Clear existing MCP associations
        await agent_db.$set('userMcps', []);

        // Handle MCP tool selections

      }



      const mcpSelections = agent.mcpTools || {};
      if (Object.keys(mcpSelections).length > 0) {
        // Add MCP associations with tool selections
        for (const [serverId, tools] of Object.entries(mcpSelections)) {
          const mcpId = parseInt(serverId);
          const mcp = await User_MCP.findOne({
            where: {
              userId: AuthHandler.profile!.sub,
              id: mcpId
            }
          })


          if (mcp) {
            await agent_db.$add('userMcps', mcp, {
              through: {
                selected_tools: tools
              }
            })
          }
        }
      }

      return await this.getAgentById(id);
    } catch (error) {
      console.error("Error updating agent:", error);
      return null;
    }
  }
}


