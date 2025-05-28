import { Backend } from '../backend.js';
import { AuthHandler } from '../helpers/AuthHandler.js';
import { BaseEvent } from './BaseEvent.js';

export class AuthLogout extends BaseEvent {
  constructor(backend: Backend) {
    super('auth.logout', backend, false, false);
  }

  override async execute(): Promise<any> {
    await AuthHandler.getInstance().logout();
  }
}

