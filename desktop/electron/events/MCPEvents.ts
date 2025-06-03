import { IpcMainInvokeEvent } from "electron";
import { Backend } from "../backend.js";
import { MCPService } from "../db/services/MCP.js";
import { BaseEvent } from "./BaseEvent.js";

export class MCPGetAll extends BaseEvent {
  constructor(backend: Backend) {
    super('mcp.getAll', backend, false, true);
  }

  override async execute(_: IpcMainInvokeEvent, filter?: Parameters<typeof MCPService.getMCPs>[0]): Promise<any> {
    return await MCPService.getMCPs(filter);
  }
}

export class MCPUninstall extends BaseEvent {
  constructor(backend: Backend) {
    super('mcp.uninstall', backend, false, true);
  }

  override async execute(_: IpcMainInvokeEvent, name: string): Promise<any> {
    return await MCPService.uninstallMCP(name)
  }
}

export class MCPInstall extends BaseEvent {
  constructor(backend: Backend) {
    super('mcp.install', backend, false, true);
  }

  override async execute(_: IpcMainInvokeEvent, name: string): Promise<any> {
    return await MCPService.installMCP(name)
  }
}

export class MCPSetActiveState extends BaseEvent {
  constructor(backend: Backend) {
    super('mcp.active', backend, false, true);
  }

  override async execute(_: IpcMainInvokeEvent, name: string, is_active: boolean): Promise<any> {
    return await MCPService.setActiveState(name, is_active)
  }
}