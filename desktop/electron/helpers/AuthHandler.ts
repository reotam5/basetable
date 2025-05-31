import { app, shell } from "electron";
import Store from "electron-store";
import { jwtDecode } from "jwt-decode";
import keytar from "keytar";
import os from "os";
import { Window } from "./Window";

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
  private static readonly AUTH_URL = "https://dev-mctp8faju5qr8drf.us.auth0.com/authorize";
  private static readonly AUTH_SCOPES = "openid profile email offline_access";
  private static readonly AUTH_CALLBACK_URL = "basetable://auth/callback";
  private static readonly CLIENT_ID = "4MXFvuUpCRkBEcxsdZ5VRIG93lstLtzs";
  private static readonly AUTH_CALLBACK_EVENT = "auth.login.complete";
  private static readonly TOKEN_EXCHANGE_URL = "https://dev-mctp8faju5qr8drf.us.auth0.com/oauth/token";
  public static readonly KEYCHAIN_SERVICE = `basetable-auth${app.isPackaged ? "" : "-dev"}`;
  public static readonly KEYCHAIN_ACCOUNT = os.userInfo().username;
  public static accessToken: string | null = null;
  public static profile: UserProfile | null = null;
  public static appStateStore = new Store({ name: "app-state" });

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

  public async logout() {
    await keytar.deletePassword(AuthHandler.KEYCHAIN_SERVICE, AuthHandler.KEYCHAIN_ACCOUNT);
    AuthHandler.accessToken = null;
    AuthHandler.profile = null;
  }

  public async login(): Promise<void> {
    const isOnboardingComplete = AuthHandler.appStateStore.get("onboarding-complete", false);
    const storedRefreshToken = await keytar.getPassword(AuthHandler.KEYCHAIN_SERVICE, AuthHandler.KEYCHAIN_ACCOUNT);

    // If we have a refresh token, use it to get new tokens. Otherwise, open the auth window.
    if (storedRefreshToken && isOnboardingComplete) {
      await this.requestTokens({ refresh_token: storedRefreshToken });
    } else {
      this.openAuthWindow();
    }
  }

  public async requestTokens({ code, refresh_token, loginOnError = true }: { code?: string; refresh_token?: string, loginOnError?: boolean }): Promise<void> {
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
      await keytar.setPassword(AuthHandler.KEYCHAIN_SERVICE, AuthHandler.KEYCHAIN_ACCOUNT, newRefreshToken);

    } catch (error) {
      console.error("Failed to get tokens:", error);
      AuthHandler.accessToken = null;
      AuthHandler.profile = null;
      await keytar.deletePassword(AuthHandler.KEYCHAIN_SERVICE, AuthHandler.KEYCHAIN_ACCOUNT);

      if (loginOnError) this.openAuthWindow();
    }
  }

  public openAuthWindow(): void {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: AuthHandler.CLIENT_ID,
      redirect_uri: AuthHandler.AUTH_CALLBACK_URL,
      scope: AuthHandler.AUTH_SCOPES,
      prompt: "login",
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
      console.error("Auth error:", error);
      return;
    }

    await this.requestTokens({ code: code });

    AuthHandler.appStateStore.set("onboarding-complete", true);
    AuthHandler.window?.moveToDefaults();

    AuthHandler.window?.windowInstance.webContents.send(AuthHandler.AUTH_CALLBACK_EVENT, {
      accessToken: AuthHandler.accessToken,
      profile: AuthHandler.profile,
    })
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