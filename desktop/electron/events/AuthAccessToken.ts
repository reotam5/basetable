import { Backend } from '../backend.js';
import { AuthHandler } from '../helpers/AuthHandler.js';
import { BaseEvent } from './BaseEvent.js';

export class AuthAccessToken extends BaseEvent {
  constructor(backend: Backend) {
    super('auth.accessToken', backend, false, true);
  }

  override async execute(): Promise<any> {
    return AuthHandler.getInstance().getAccessToken();
  }
}
