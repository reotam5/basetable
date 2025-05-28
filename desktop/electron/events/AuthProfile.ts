import { Backend } from '../backend.js';
import { AuthHandler } from '../helpers/AuthHandler.js';
import { BaseEvent } from './BaseEvent.js';

export class AuthProfile extends BaseEvent {
  constructor(backend: Backend) {
    super('auth.profile', backend, false, true);
  }

  override async execute(): Promise<any> {
    console.log('Executing auth.profile event');
    console.log(AuthHandler.profile);
    return AuthHandler.profile
  }
}


