import { KeyManager } from '../helpers/key-manager.js';
import { BaseEvent } from './base-events.js';

export class DatabaseGetEncryption extends BaseEvent {
  constructor() {
    super('db.encryption.get', false, true);
  }

  override async execute(): Promise<any> {
    return await KeyManager.getKey(KeyManager.KEYS.DB_PASSWORD);
  }
}