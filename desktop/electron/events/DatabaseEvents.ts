import { IpcMainInvokeEvent } from 'electron';
import { Backend } from '../backend.js';
import { Database } from '../db/Database.js';
import { BaseEvent } from './BaseEvent.js';

export class DatabaseGetEncryption extends BaseEvent {
  constructor(backend: Backend) {
    super('db.encryption.get', backend, false, true);
  }

  override async execute(): Promise<any> {
    return Database.getEncryption();
  }
}

export class DatabaseExportApplicationSettings extends BaseEvent {
  constructor(backend: Backend) {
    super('db.export.applicationSettings', backend, false, true);
  }

  override async execute(): Promise<any> {
    return await Database.exportApplicationSettings();
  }
}


export class DatabaseImport extends BaseEvent {
  constructor(backend: Backend) {
    super('db.import', backend, false, true);
  }

  override async execute(_: IpcMainInvokeEvent, data: any): Promise<any> {
    return await Database.importSettings(data);
  }
}


export class DatabaseResetApplicationSettings extends BaseEvent {
  constructor(backend: Backend) {
    super('db.reset.applicationSettings', backend, false, true);
  }

  override async execute(): Promise<any> {
    return await Database.resetApplicationSettings();
  }
}