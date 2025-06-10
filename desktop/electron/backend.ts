import { app, ipcMain, IpcMainEvent, IpcMainInvokeEvent } from "electron";
import { join } from "path";
import { Database } from "./db/Database.js";
import { BaseEvent } from "./events/BaseEvent.js";
import { events } from "./events/index.js";
import { AuthHandler, KeyManager, Window } from "./helpers/index.js";
import { Logger } from "./helpers/Logger.js";
import { StreamManager } from "./helpers/StreamManager.js";

let once = false;

export class Backend {
  private readonly isProd: boolean = app.isPackaged;
  private mainWindow: Window | null = null;

  public static main(): Backend {
    return new Backend();
  }

  public constructor() {
    if (!this.isProd) {
      app.setPath("userData", `${app.getPath("userData")} (non-production)`);
    }
    Logger.initialize();

    // Request single instance lock for protocol handling
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
      Logger.warn("Another instance is running, quitting...");
      app.quit();
      return;
    }

    // Handle deep links (macOS and Windows/Linux)
    this.handleDeepLink((url: string) => {
      Logger.debug("Received deep link:", url);
      AuthHandler.getInstance().handleAuthCallback(url);
    });

    app.on("window-all-closed", () => {
      app.quit();
    });

    app.once("ready", async () => {
      await this.registerEvents();

      this.mainWindow = new Window(this, "controller", {
        titleBarStyle: "hiddenInset",
        trafficLightPosition: { x: 17, y: 20 },
        minHeight: 245,
        minWidth: 600,
        autoHideMenuBar: true,
        show: false,
      });
      await Database.initialize(this.mainWindow);
      await Database.registerModel();
      await Database.registerService();
      AuthHandler.getInstance().setWindow(this.mainWindow);

      // Initialize StreamManager to register IPC handlers
      StreamManager.getInstance();

      if (this.isProd) {
        this.mainWindow?.windowInstance.loadFile(join(app.getAppPath(), "dist/react/index.html"));
      } else {
        this.mainWindow?.windowInstance.loadURL("http://localhost:3001");
      }

      this.mainWindow?.windowInstance.webContents.on('did-finish-load', async () => {
        // if there is a stored refresh token, login before starting the main window
        const storedRefreshToken = await KeyManager.getKey(KeyManager.KEYS.REFRESH_TOKEN)
        if (storedRefreshToken) {
          await AuthHandler.getInstance().requestTokens({ refresh_token: storedRefreshToken, loginOnError: false, logoutOnError: true });
        } else {
          await AuthHandler.getInstance().logout();
        }

        // added here to prevent electron getting focused on every code save
        if (!once) {
          once = true;
          this.mainWindow?.windowInstance.show();
        }
      })
    });

    app.on('before-quit', async () => {
      // Cleanup streams before closing
      StreamManager.getInstance().cleanup();
      await Database.close();
    })
  }

  public isProduction(): boolean {
    return this.isProd;
  }

  public getMainWindow(): Window | null {
    return this.mainWindow;
  }

  private handleDeepLink(callback: (url: string) => void): void {
    const baseUrl = "basetable";
    // Register custom protocol handler for auth redirects
    app.setAsDefaultProtocolClient(baseUrl);

    // Handle deep links (macOS)
    app.on("open-url", (event, url) => {
      event.preventDefault();
      callback(url);
    });

    // Handle deep links (Windows/Linux)
    app.on("second-instance", (event, commandLine) => {
      // Someone tried to run a second instance, focus our window instead
      if (this.mainWindow) {
        if (this.mainWindow.windowInstance.isMinimized()) {
          this.mainWindow.windowInstance.restore();
        }
        this.mainWindow.windowInstance.focus();
      }

      // Check if launched with protocol URL
      const url = commandLine.find((arg) => arg.startsWith(`${baseUrl}://`));
      if (url) {
        callback(url);
      }
    })

    app.on("ready", () => {
      const url = process.argv.find(arg => arg.startsWith(`${baseUrl}://`));
      if (url) {
        callback(url);
      }
    })
  }

  private async registerEvents(): Promise<void> {
    for await (const eventClass of events) {
      try {
        const event: BaseEvent = new eventClass(this);
        Logger.debug('Registering event:', event.getName());
        if (event.useInvoke()) {
          ipcMain.handle(event.getName(), (receivedEvent: IpcMainInvokeEvent, ...args: any[]) => event.preExecute(receivedEvent, ...args).catch((error: any) => {
            Logger.error('An error occurred while executing invoke event ' + event.getName(), error);
          }));
        } else {
          if (event.runOnce()) {
            ipcMain.once(event.getName(), (receivedEvent: IpcMainEvent, ...args: any[]) => event.preExecute(receivedEvent, ...args).catch((error: any) => {
              Logger.error('An error occurred while executing single-run event ' + event.getName(), error);
            }));
          } else {
            ipcMain.on(event.getName(), (receivedEvent: IpcMainEvent, ...args: any[]) => event.preExecute(receivedEvent, ...args).catch((error: any) => {
              Logger.error('An error occurred while executing event ' + event.getName(), error);
            }));
          }
        }
      } catch (error) {
        Logger.error('An error occurred while registering event ' + eventClass.name, error);
      }
    }
  }
}
