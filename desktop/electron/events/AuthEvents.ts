import { IpcMainEvent } from 'electron';
import { Backend } from '../backend.js';
import { AuthHandler } from '../helpers/AuthHandler.js';
import { KeyManager } from '../helpers/KeyManager.js';
import { BaseEvent } from './BaseEvent.js';

export class AuthAccessToken extends BaseEvent {
  constructor(backend: Backend) {
    super('auth.accessToken', backend, false, true);
  }

  override async execute(): Promise<any> {
    return AuthHandler.getInstance().getAccessToken();
  }
}


export class AuthLogin extends BaseEvent {
  constructor(backend: Backend) {
    super('auth.login', backend, false, true);
  }

  override async execute(_: IpcMainEvent, silent: boolean): Promise<any> {
    if (!silent) {
      await AuthHandler.getInstance().login();
    } else {

      const storedRefreshToken = await KeyManager.getKey(KeyManager.KEYS.REFRESH_TOKEN)
      if (storedRefreshToken) {
        await AuthHandler.getInstance().requestTokens({ refresh_token: storedRefreshToken, loginOnError: false });
      }
      return {
        accessToken: AuthHandler.accessToken,
        profile: AuthHandler.profile,
      }
    }
  }
}

export class AuthLogout extends BaseEvent {
  constructor(backend: Backend) {
    super('auth.logout', backend, false, false);
  }

  override async execute(): Promise<any> {
    await AuthHandler.getInstance().logout();
  }
}

export class AuthOpen extends BaseEvent {
  constructor(backend: Backend) {
    super('auth.open', backend, false);
  }

  override async execute(): Promise<void> {
    AuthHandler.getInstance().openAuthWindow();
  }
}

export class AuthProfile extends BaseEvent {
  constructor(backend: Backend) {
    super('auth.profile', backend, false, true);
  }

  override async execute(): Promise<any> {
    return AuthHandler.profile
  }
}
