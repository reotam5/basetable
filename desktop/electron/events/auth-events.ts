import { IpcMainEvent } from 'electron';
import { AuthHandler } from '../helpers/auth-handler.js';
import { KeyManager } from '../helpers/key-manager.js';
import { BaseEvent } from './base-events.js';

export class AuthAccessToken extends BaseEvent {
  constructor() {
    super('auth.accessToken', false, true);
  }

  override async execute() {
    return AuthHandler.getInstance().getAccessToken();
  }
}


export class AuthLogin extends BaseEvent {
  constructor() {
    super('auth.login', false, true);
  }

  override async execute(_: IpcMainEvent, silent: boolean) {
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
  constructor() {
    super('auth.logout', false, false);
  }

  override async execute(): Promise<void> {
    await AuthHandler.getInstance().logout();
  }
}

export class AuthOpen extends BaseEvent {
  constructor() {
    super('auth.open', false);
  }

  override async execute(): Promise<void> {
    AuthHandler.getInstance().openAuthWindow();
  }
}

export class AuthProfile extends BaseEvent {
  constructor() {
    super('auth.profile', false, true);
  }

  override async execute() {
    return AuthHandler.profile
  }
}
