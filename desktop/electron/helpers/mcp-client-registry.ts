import { mcp_server } from "../database/tables/mcp-server.js";
import { MCPService } from "../services/mcp-service.js";
import { Logger } from "./custom-logger.js";
import { MCPClient } from "./mcp-client.js";

/**
 * This is basibally mcp host. 
 * It contains mcp clients and is a central place to choose and connect to specific MCP servers.
 * When list of MCP servers are modified (added, removed, etc.), sync method should be called to update the list of clients.
 * Singleton class.
 */
class McpClientRegistry {
  private clients: Map<number, MCPClient> = new Map();


  /**
   * Adds a new MCP client to the registry.
   * @param client The MCP client to add.
   */
  public async addClient(mcpServerId: number, config: typeof mcp_server.$inferSelect) {
    const client = await this.createClient(config);
    if (!client) {
      return;
    }

    this.clients.set(mcpServerId, client);
    return client;
  }

  public async createClient(config: typeof mcp_server.$inferSelect) {
    if (!config.server_config?.command) {
      Logger.warn(`MCP server - ${config.name} is missing server configuration. Cannot add client.`);
      return undefined;
    }
    const client = new MCPClient({
      serverConfig: {
        command: config.server_config?.command.trim(),
        args: config.server_config?.args || [],
        env: { ...(process.env as any ?? {}), ...(config.server_config?.env ?? {}) },
        cwd: config.server_config?.cwd || process.cwd(),
      }
    })
    await client.connect();
    return client;
  }

  /**
   * Removes an MCP client from the registry by its userMcpId.
   * @param mcpServerId The ID of the user MCP to remove.
   */
  public removeClient(mcpServerId: number) {
    this.clients.delete(mcpServerId);
  }

  /**
   * Get an MCP client by its userMcpId.
   * @param mcpServerId The ID of the user MCP to get.
   * @returns The MCP client or undefined if not found.
   */
  public getClient(mcpServerId: number): MCPClient | undefined {
    return this.clients.get(mcpServerId);
  }

  /**
   * Sync mcp db entry with updated tools.
   */
  public async syncOne(mcpServerId: number) {
    let client = this.getClient(mcpServerId);
    const db_mcp = await MCPService.getMCP(mcpServerId);
    if (!client) {
      if (!db_mcp?.server_config?.command) {
        Logger.warn(`MCP server - ${db_mcp?.name} is missing server configuration. Cannot sync tools.`);
        return;
      }

      if (db_mcp?.is_active) {
        client = await this.addClient(mcpServerId, db_mcp);
      } else {
        client = await this.createClient(db_mcp);
      }
    }

    if (!client) {
      Logger.warn(`Failed to create MCP client for server - ${db_mcp?.name}`);
      return;
    }

    const mcpName = client.getVersion()?.name;
    await MCPService.updateMcpName(mcpServerId, mcpName!);

    const tools = await client.listTools();
    await MCPService.updateAvailableTools(mcpServerId, tools?.map(t => ({
      id: t.name,
      name: t.name,
      title: t.title,
      description: t.description,
      inputSchema: t.inputSchema,
    })));

    if (!db_mcp?.is_active) {
      await client.disconnect();
      this.removeClient(mcpServerId);
    }
  }

  /**
   * Sync the registry with the current list of MCP servers
   */
  public async sync() {
    const mcpServers = await MCPService.getMCPs({ is_active: true });

    await Promise.all(
      mcpServers.map(async (mcp) => {
        try {
          await this.syncOne(mcp.id);
        } catch {
          MCPService.setActiveState(mcp.id, false);
        }
      })
    );
  }

}

export const mcpClientRegistry = new McpClientRegistry();