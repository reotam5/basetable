import { IpcMainInvokeEvent } from "electron";
import { Backend } from "../backend.js";
import { APIKeyService } from "../db/services/APIKey.js";
import { BaseEvent } from "./BaseEvent.js";

export class APIKeySet extends BaseEvent {
  constructor(backend: Backend) {
    super('apikey.set', backend, false, true);
  }

  override async execute(_: IpcMainInvokeEvent, name: string, value: string): Promise<any> {
    return await APIKeyService.setKey(name, value);
  }
}

export class APIKeyDelete extends BaseEvent {
  constructor(backend: Backend) {
    super('apikey.delete', backend, false, true);
  }

  override async execute(_: IpcMainInvokeEvent, name: string): Promise<any> {
    return await APIKeyService.deleteKey(name);
  }
}