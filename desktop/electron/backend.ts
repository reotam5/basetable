import { app, shell } from "electron";
import { join } from "path";
import { Window } from "./helpers/index.js";

export class Backend {
  private readonly isProd: boolean = app.isPackaged;
  private mainWindow: Window | null = null;

  public static main(): Backend {
    return new Backend();
  }

  public constructor() {
    console.log("Backend constructor called");

    if (!this.isProd) {
      app.setPath("userData", `${app.getPath("userData")} (non-production)`);
    }

    // Request single instance lock for protocol handling
    const gotTheLock = app.requestSingleInstanceLock();

    console.log("Single instance lock:", gotTheLock);

    if (!gotTheLock) {
      console.log("Another instance is running, quitting...");
      app.quit();
      return;
    }

    // Register custom protocol handler for auth redirects
    if (!app.isDefaultProtocolClient("basetable")) {
      app.setAsDefaultProtocolClient("basetable");
    }

    // Handle protocol URLs when app is already running
    app.on("open-url", (event, url) => {
      event.preventDefault();
      this.handleAuthCallback(url);
    });

    // Handle protocol URLs when app is launched from URL (Windows/Linux)
    app.on("second-instance", (event, commandLine) => {
      // Someone tried to run a second instance, focus our window instead
      if (this.mainWindow) {
        if (this.mainWindow.windowInstance.isMinimized()) {
          this.mainWindow.windowInstance.restore();
        }
        this.mainWindow.windowInstance.focus();
      }

      // Check if launched with protocol URL
      const url = commandLine.find((arg) => arg.startsWith("basetable://"));
      if (url) {
        this.handleAuthCallback(url);
      }
    });

    app.on("window-all-closed", () => {
      console.log("All windows closed, quitting app");
      app.quit();
    });

    app.once("ready", async () => {
      console.log("App ready, starting backend");
      await this.start();
    });
  }

  private async start(): Promise<void> {
    console.log("Creating main window");
    this.mainWindow = new Window(this, "controller", {
      width: 800,
      height: 600,
      minWidth: 800,
      minHeight: 600,
    });

    console.log("Main window created, loading content");
    if (this.isProd) {
      this.mainWindow.windowInstance.loadFile(
        join(app.getAppPath(), "dist/react/index.html"),
      );
    } else {
      this.mainWindow.windowInstance.loadURL("http://localhost:3001");
    }
    console.log("Content loaded");
  }

  public isProduction(): boolean {
    return this.isProd;
  }

  private async handleAuthCallback(url: string): Promise<void> {
    // Parse the URL and extract token/auth data
    const urlObj = new URL(url);
    console.log(urlObj.pathname);

    console.log("Auth callback received:", url);

    const params = new URLSearchParams(urlObj.search);
    const code = params.get("code");
    const error = params.get("error");
    const state = params.get("state");

    if (error) {
      console.error("Auth error:", error);
      if (this.mainWindow) {
        this.mainWindow.windowInstance.webContents.send("auth-callback", {
          error: error,
          state: state,
        });
      }
      return;
    }

    if (!code) {
      console.error("No authorization code received");
      if (this.mainWindow) {
        this.mainWindow.windowInstance.webContents.send("auth-callback", {
          error: "No authorization code received",
          state: state,
        });
      }
      return;
    }

    try {
      // Exchange authorization code for tokens
      const tokens = await this.exchangeCodeForTokens(code);
      console.log(tokens);

      if (this.mainWindow) {
        this.mainWindow.windowInstance.webContents.send("auth-callback", {
          token: tokens.access_token,
          id_token: tokens.id_token,
          state: state,
        });
      }
    } catch (error) {
      console.error("Token exchange failed:", error);
      if (this.mainWindow) {
        this.mainWindow.windowInstance.webContents.send("auth-callback", {
          error: "Token exchange failed",
          state: state,
        });
      }
    }
  }

  private async exchangeCodeForTokens(code: string): Promise<any> {
    const tokenUrl = "https://dev-mctp8faju5qr8drf.us.auth0.com/oauth/token";

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: "4MXFvuUpCRkBEcxsdZ5VRIG93lstLtzs",
      code: code,
      redirect_uri: "basetable://auth/callback",
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  public openAuthUrl(): void {
    console.log("Backend: openAuthUrl called");
    const authUrl = this.buildAuth0Url();

    console.log("Opening auth URL:", authUrl);
    shell.openExternal(authUrl);
  }

  buildAuth0Url() {
    const baseUrl = "https://dev-mctp8faju5qr8drf.us.auth0.com/authorize";
    const params = new URLSearchParams({
      response_type: "code",
      client_id: "4MXFvuUpCRkBEcxsdZ5VRIG93lstLtzs",
      redirect_uri: "basetable://auth/callback",
      scope: "openid profile email",
      state: "test",
    });

    return `${baseUrl}?${params.toString()}`;
  }

  public getMainWindow(): Window | null {
    return this.mainWindow;
  }
}
