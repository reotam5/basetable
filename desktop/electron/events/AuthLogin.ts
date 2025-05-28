import { IpcMainEvent } from 'electron';
import keytar from 'keytar';
import { Backend } from '../backend.js';
import { AuthHandler } from '../helpers/AuthHandler.js';
import { BaseEvent } from './BaseEvent.js';

export class AuthLogin extends BaseEvent {
  constructor(backend: Backend) {
    super('auth.login', backend, false, true);
  }

  override async execute(_: IpcMainEvent, silent: boolean): Promise<any> {
    if (!silent) {
      await AuthHandler.getInstance().login();
    } else {
      const storedRefreshToken = await keytar.getPassword(AuthHandler.KEYCHAIN_SERVICE, AuthHandler.KEYCHAIN_ACCOUNT);
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
