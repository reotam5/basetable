import { randomUUID } from "crypto";
import { shell } from "electron";
import Store from "electron-store";
import { jwtDecode } from "jwt-decode";
import { electronConfig } from "../config.js";
import { UserService } from "../services/user-service.js";
import { Logger } from "./custom-logger.js";
import { Window } from "./custom-window.js";
import { KeyManager } from "./key-manager.js";
import { PaymentHandler } from "./payment-handler.js";
import { Screen, screenManager } from "./screen-manager.js";

export interface UserProfile {
  given_name: string;
  family_name: string;
  nickname: string;
  name: string;
  picture: string;
  updated_at: string;
  email: string;
  email_verified: boolean;
  iss: string;
  aud: string;
  sub: string;
  iat: number;
  exp: number;
  sid: string;
  auth_time: number;
}

export class AuthHandler {
  private static instance: AuthHandler | null = null;
  private static window: Window | null = null;
  private static readonly AUTH_URL = `${electronConfig.auth_provider_url}/authorize`;
  private static readonly AUTH_SCOPES = "openid profile email offline_access";
  private static readonly AUTH_CALLBACK_URL = electronConfig.auth_callback_url;
  private static readonly CLIENT_ID = electronConfig.client_id;
  private static readonly LOGIN_CALLBACK_EVENT = "auth.login.complete";
  private static readonly LOGOUT_CALLBACK_EVENT = "auth.logout.complete";
  private static readonly TOKEN_EXCHANGE_URL = `${electronConfig.auth_provider_url}/oauth/token`;
  public static accessToken: string | null = null;
  public static profile: UserProfile | null = null;
  public static appStateStore = new Store({ name: "app-state" });
  private static CSFR_STATE: string | null = null;

  private constructor() {
    // Private constructor to prevent instantiation
  }

  public static getInstance(): AuthHandler {
    if (!AuthHandler.instance) {
      AuthHandler.instance = new AuthHandler();
    }
    return AuthHandler.instance;
  }

  public setWindow(window: Window): void {
    AuthHandler.window = window;
  }

  public async checkInitialAuth() {
    screenManager.setScreen(Screen.PRE_LOGIN_LOADING);

    const storedRefreshToken = await KeyManager.getKey(KeyManager.KEYS.REFRESH_TOKEN)
    if (storedRefreshToken) {
      await AuthHandler.getInstance().requestTokens({ refresh_token: storedRefreshToken, loginOnError: false, logoutOnError: true });

      if (AuthHandler.profile) {
        screenManager.setScreen(Screen.POST_LOGIN_LOADING)
        return
      }
    }

    await AuthHandler.getInstance().logout();
    screenManager.setScreen(Screen.LOGIN);
  }

  public async logout() {
    await KeyManager.deleteKey(KeyManager.KEYS.REFRESH_TOKEN)
    AuthHandler.appStateStore.set("onboarding-complete", false);
    AuthHandler.accessToken = null;
    AuthHandler.profile = null;
    AuthHandler.window?.windowInstance.webContents.send(AuthHandler.LOGOUT_CALLBACK_EVENT)
    screenManager.setScreen(Screen.LOGIN);
  }

  public async login(): Promise<void> {
    const isOnboardingComplete = AuthHandler.appStateStore.get("onboarding-complete", false);
    const storedRefreshToken = await KeyManager.getKey(KeyManager.KEYS.REFRESH_TOKEN)

    // If we have a refresh token, use it to get new tokens. Otherwise, open the auth window.
    if (storedRefreshToken && isOnboardingComplete) {
      await this.requestTokens({ refresh_token: storedRefreshToken });
    } else {
      this.openAuthWindow();
    }
  }

  public async requestTokens({ code, refresh_token, loginOnError = true, logoutOnError = false }: { code?: string; refresh_token?: string, loginOnError?: boolean, logoutOnError?: boolean }): Promise<void> {
    const body = {
      client_id: AuthHandler.CLIENT_ID,
      ...(refresh_token ? {
        grant_type: "refresh_token",
        refresh_token: refresh_token,
      } : {}),
      ...(code ? {
        grant_type: "authorization_code",
        code: code,
        redirect_uri: AuthHandler.AUTH_CALLBACK_URL,
      } : {}),
    }
    try {
      const response = await fetch(AuthHandler.TOKEN_EXCHANGE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(body).toString(),
      });
      const { access_token, id_token, refresh_token: newRefreshToken } = await response.json();
      AuthHandler.accessToken = access_token;
      AuthHandler.profile = jwtDecode<UserProfile>(id_token);
      await KeyManager.setKey(KeyManager.KEYS.REFRESH_TOKEN, newRefreshToken);

      const db_user = await UserService.getUserById(AuthHandler.profile.sub);

      // this user is first time logging in. create a new user and load up default entries
      if (!db_user) {
        await UserService.createUser({
          id: AuthHandler.profile?.sub,
          name: AuthHandler.profile?.name,
          email: AuthHandler.profile?.email,
          picture: AuthHandler.profile?.picture,
        })
      }

      AuthHandler.window?.windowInstance.webContents.send(AuthHandler.LOGIN_CALLBACK_EVENT, {
        accessToken: AuthHandler.accessToken,
        profile: AuthHandler.profile,
        credits: await PaymentHandler.getAvailableCredit(),
      })
    } catch (error) {
      Logger.error("Error requesting tokens:", error);
      AuthHandler.accessToken = null;
      AuthHandler.profile = null;
      await KeyManager.deleteKey(KeyManager.KEYS.REFRESH_TOKEN);

      if (loginOnError) this.openAuthWindow();
      if (logoutOnError) await this.logout()
    }
  }

  public openAuthWindow(): void {
    AuthHandler.CSFR_STATE = randomUUID();
    const params = new URLSearchParams({
      response_type: "code",
      client_id: AuthHandler.CLIENT_ID,
      redirect_uri: AuthHandler.AUTH_CALLBACK_URL,
      scope: AuthHandler.AUTH_SCOPES,
      prompt: "login",
      state: AuthHandler.CSFR_STATE,
    });

    const authUrl = `${AuthHandler.AUTH_URL}?${params.toString()}`;
    shell.openExternal(authUrl);
  }

  public async handleAuthCallback(url: string): Promise<void> {
    // Parse the URL and extract token/auth data
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    const code = params.get("code");
    const error = params.get("error");

    if (error || !code) {
      Logger.error("Authentication error from deeplink", error);
      return;
    }

    // check state to prevent CSRF attacks
    const state = params.get("state");
    if (!state || state !== AuthHandler.CSFR_STATE) {
      Logger.error("Invalid state parameter in authentication callback");
      return;
    }
    AuthHandler.CSFR_STATE = null;

    await this.requestTokens({ code: code });

    AuthHandler.appStateStore.set("onboarding-complete", true);
    screenManager.setScreen(Screen.POST_LOGIN_LOADING);
  }

  public async getAccessToken(): Promise<string | null> {
    if (AuthHandler.accessToken && AuthHandler.profile && AuthHandler.profile.exp && AuthHandler.profile.exp > Date.now() / 1000) {
      // If we have a valid access token, return it
      return AuthHandler.accessToken;
    }
    await AuthHandler.getInstance().login();
    return AuthHandler.accessToken;
  }
}