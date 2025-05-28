import { Backend } from '../backend.js';
import { AuthHandler } from '../helpers/AuthHandler.js';
import { BaseEvent } from './BaseEvent.js';

export class AuthOpen extends BaseEvent {
  constructor(backend: Backend) {
    super('auth.open', backend, false);
  }

  override async execute(): Promise<void> {
    AuthHandler.getInstance().openAuthWindow();
  }
}

