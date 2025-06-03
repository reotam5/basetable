import { IpcMainInvokeEvent } from "electron";
import { Backend } from "../backend.js";
import { SettingService } from "../db/services/Setting.js";
import { BaseEvent } from "./BaseEvent.js";

export class SettingsGet extends BaseEvent {
  constructor(backend: Backend) {
    super('settings.get', backend, false, true);
  }

  override async execute(_: IpcMainInvokeEvent, key: string): Promise<any> {
    return await SettingService.getSetting(key)
  }
}

export class SettingsSet extends BaseEvent {
  constructor(backend: Backend) {
    super('settings.set', backend, false, true);
  }

  override async execute(_: IpcMainInvokeEvent, key: string, value: string): Promise<any> {
    await SettingService.setSetting(key, value);
  }
}


