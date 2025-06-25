import { app, ipcMain, IpcMainEvent, IpcMainInvokeEvent } from "electron";
import { join } from "path";
import Database from "./database/database.js";
import { seedDatabase } from "./database/seeder.js";
import { BaseEvent } from "./events/base-events.js";
import { events } from "./events/index.js";
import { AuthHandler } from "./helpers/auth-handler.js";
import { chatOrchestrator } from "./helpers/chat-orchestrator.js";
import { Logger } from "./helpers/custom-logger.js";
import { Window } from "./helpers/custom-window.js";
import { mcpClientRegistry } from "./helpers/mcp-client-registry.js";
import { PaymentHandler } from "./helpers/payment-handler.js";
import { Screen, screenManager } from "./helpers/screen-manager.js";
import { StreamManager } from "./helpers/stream-manager.js";
import "./services/index.js";
import { UserService } from "./services/index.js";

let once = true;

class Backend {
  private readonly isProd: boolean = app.isPackaged;
  public mainWindow!: Window;

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
      const path = url.split(":/")[1]?.split("?")[0] || "";
      switch (path) {
        case "/auth/login":
          AuthHandler.getInstance().handleAuthCallback(url);
          break;
        case "/payment/success":
          PaymentHandler.handlePaymentSuccess(this.getMainWindow()!, url);
          break;
        case "/payment/cancel":
          PaymentHandler.handlePaymentCancel(this.getMainWindow()!, url);
          break;
        default:
          Logger.warn(`Unhandled path in deep link: ${path}`);
          break;
      }
    });

    app.on("window-all-closed", () => {
      app.quit();
    });

    app.once("ready", async () => {
      await this.registerEvents();

      this.mainWindow = new Window("controller", {
        titleBarStyle: "hiddenInset",
        trafficLightPosition: { x: 17, y: 20 },
        width: 0,
        height: 0,
        autoHideMenuBar: true,
        show: false,
      });
      await Database.initialize();
      AuthHandler.getInstance().setWindow(this.mainWindow);

      // Initialize StreamManager to register IPC handlers
      StreamManager.getInstance();

      if (this.isProd) {
        this.mainWindow?.windowInstance.loadFile(join(app.getAppPath(), "dist/react/index.html"));
      } else {
        this.mainWindow?.windowInstance.loadURL("http://localhost:3001");
      }

      this.mainWindow.windowInstance.on("ready-to-show", () => {
        if (once) {
          once = false;
          this.mainWindow?.windowInstance.show();
        }
      })

      ipcMain.on('window.initialized', async () => {
        await AuthHandler.getInstance().checkInitialAuth();
      })

      screenManager.onScreenChange(async (screen) => {
        if (screen === Screen.POST_LOGIN_LOADING) {
          await seedDatabase();

          if ((await UserService.getMe()).saw_model_download) {
            screenManager.setScreen(Screen.POST_MODEL_DOWNLOAD_LOADING);
          } else {
            screenManager.setScreen(Screen.MODEL_DOWNLOAD);
            await UserService.updateMe({ saw_model_download: true });
          }
        } else if (screen === Screen.POST_MODEL_DOWNLOAD_LOADING) {
          await chatOrchestrator.loadLLMModels();
          await chatOrchestrator.loadAgents();
          await mcpClientRegistry.sync();
          screenManager.setScreen(Screen.APP);
        }
      })
    });

    app.on('before-quit', async () => {
      // Cleanup streams before closing
      StreamManager.getInstance().cleanup();
      await Database.close();
    })
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
        const event: BaseEvent = new eventClass();
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

const instance = new Backend();
type BackendType = typeof Backend;
export { instance as backend };
export type { BackendType as Backend };

