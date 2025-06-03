import { IpcMainInvokeEvent } from "electron";
import { Backend } from "../backend.js";
import { AgentService } from "../db/services/Agent.js";
import { StyleService } from "../db/services/Style.js";
import { BaseEvent } from "./BaseEvent.js";

export class AgentGetAll extends BaseEvent {
  constructor(backend: Backend) {
    super('agent.getAll', backend, false, true);
  }

  override async execute(): Promise<any> {
    return await AgentService.getAgents();
  }
}

export class AgentDelete extends BaseEvent {
  constructor(backend: Backend) {
    super('agent.delete', backend, false, true);
  }

  override async execute(_: IpcMainInvokeEvent, id: Parameters<typeof AgentService.deleteAgent>[0]): Promise<any> {
    return await AgentService.deleteAgent(id);
  }
}

export class AgentCreate extends BaseEvent {
  constructor(backend: Backend) {
    super('agent.create', backend, false, true);
  }

  override async execute(_: IpcMainInvokeEvent, agent: Parameters<typeof AgentService.createAgent>[0]): Promise<any> {
    return await AgentService.createAgent(agent);
  }
}

export class AgentGet extends BaseEvent {
  constructor(backend: Backend) {
    super('agent.get', backend, false, true);
  }

  override async execute(_: IpcMainInvokeEvent, id: number): Promise<any> {
    return await AgentService.getAgent(id);
  }
}

export class AgentGetMain extends BaseEvent {
  constructor(backend: Backend) {
    super('agent.getMain', backend, false, true);
  }

  override async execute(): Promise<any> {
    return await AgentService.getMainAgent();
  }
}

export class AgentUpdate extends BaseEvent {
  constructor(backend: Backend) {
    super('agent.update', backend, false, true);
  }

  override async execute(_: IpcMainInvokeEvent, id: number, agent?: Parameters<typeof AgentService.updateAgent>[1]): Promise<any> {
    return await AgentService.updateAgent(id, agent);
  }
}

export class AgentGetTones extends BaseEvent {
  constructor(backend: Backend) {
    super('agent.get.tones', backend, false, true);
  }

  override async execute(): Promise<any> {
    return await StyleService.getStyles({ type: 'tone' });
  }
}

export class AgentGetStyles extends BaseEvent {
  constructor(backend: Backend) {
    super('agent.get.styles', backend, false, true);
  }

  override async execute(): Promise<any> {
    return await StyleService.getStyles({ type: 'style' });
  }
}