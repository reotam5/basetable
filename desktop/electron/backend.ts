import { app, ipcMain, IpcMainEvent, IpcMainInvokeEvent } from "electron";
import { join } from "path";
import { BaseEvent } from "./events/BaseEvent.js";
import { events } from "./events/index.js";
import { AuthHandler, Window } from "./helpers/index.js";

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

    // Request single instance lock for protocol handling
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
      console.log("Another instance is running, quitting...");
      app.quit();
      return;
    }

    // Handle deep links (macOS and Windows/Linux)
    this.handleDeepLink((url: string) => {
      console.log("Received deep link:", url);
      AuthHandler.getInstance().handleAuthCallback(url);
    });

    app.on("window-all-closed", () => {
      console.log("All windows closed, quitting app");
      app.quit();
    });

    app.once("ready", async () => {
      console.log("App ready, starting backend");
      await this.registerEvents();
      await this.start();
    });
  }

  public isProduction(): boolean {
    return this.isProd;
  }

  public getMainWindow(): Window | null {
    return this.mainWindow;
  }

  private async start(): Promise<void> {
    this.mainWindow = new Window(this, "controller", {
      titleBarStyle: "hiddenInset",
      trafficLightPosition: { x: 17, y: 20 },
      minHeight: 245,
      minWidth: 600,
      autoHideMenuBar: true,
    });

    if (this.isProd) {
      this.mainWindow.windowInstance.loadFile(join(app.getAppPath(), "dist/react/index.html"));
    } else {
      this.mainWindow.windowInstance.loadURL("http://localhost:3001");
    }

    AuthHandler.getInstance().setWindow(this.mainWindow);
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
        console.log('Registering event:', event.getName());
        if (event.useInvoke()) {
          ipcMain.handle(event.getName(), (receivedEvent: IpcMainInvokeEvent, ...args: any[]) => event.preExecute(receivedEvent, ...args).catch((error: any) => {
            console.error('An error occurred while executing invoke event ' + event.getName(), error);
          }));
        } else {
          if (event.runOnce()) {
            ipcMain.once(event.getName(), (receivedEvent: IpcMainEvent, ...args: any[]) => event.preExecute(receivedEvent, ...args).catch((error: any) => {
              console.error('An error occurred while executing single-run event ' + event.getName(), error);
            }));
          } else {
            ipcMain.on(event.getName(), (receivedEvent: IpcMainEvent, ...args: any[]) => event.preExecute(receivedEvent, ...args).catch((error: any) => {
              console.error('An error occurred while executing event ' + event.getName(), error);
            }));
          }
        }
      } catch (error) {
        console.error('An error occurred while registering event ' + eventClass.name, error);
      }
    }
  }
}
