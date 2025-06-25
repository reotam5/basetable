import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Logger } from "./custom-logger.js";

type MCPClientConfig = {
  serverConfig: ConstructorParameters<typeof StdioClientTransport>[0]
}

export class MCPClient {
  private mcp: Client
  private serverConfig: MCPClientConfig['serverConfig'];
  private transport?: StdioClientTransport;

  constructor(config: MCPClientConfig) {
    this.mcp = new Client({
      name: 'basetable-mcp-client',
      version: '1.0.0',
    });
    this.serverConfig = config.serverConfig;
  }

  get transportInstance() {
    return this.transport;
  }

  get clientInstance() {
    return this.mcp;
  }

  /**
   * Runs and connects to the MCP client with the provided server configuration.
   * If no server configuration is provided, it uses the default configuration from the constructor.
   */
  async connect(serverConfig?: Partial<MCPClientConfig['serverConfig']>) {
    try {
      this.transport = new StdioClientTransport({
        ...this.serverConfig,
        ...serverConfig,
      })

      await this.mcp.connect(this.transport);
    } catch (error) {
      Logger.error("Failed to create MCP transport:", error);
      throw error;
    }
  }

  getVersion() {
    return this.mcp.getServerVersion();
  }

  async listTools() {
    return (await this.mcp.listTools()).tools;
  }

  async callTool(data: Parameters<typeof this.mcp.callTool>[0]): Promise<ReturnType<typeof this.mcp.callTool>> {
    try {
      const result = await this.mcp.callTool(data);
      return result;
    } catch (error) {
      return {
        isError: true,
        content: `Error calling tool: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  async disconnect() {
    try {
      await this.mcp.close()
      return true;
    } catch (error) {
      Logger.error('Failed to disconnect MCP client:', error);
      return false;
    }
  }

  async status() {
    try {
      return !!(await this.mcp.ping())
    } catch {
      return false;
    }
  }
}