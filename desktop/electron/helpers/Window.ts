import {
    app,
    BrowserWindow,
    BrowserWindowConstructorOptions,
    Rectangle,
    screen
} from "electron";
import Store from "electron-store";
import path from "path";
import { fileURLToPath } from "url";
import { WindowResizeOnboarding } from "../events/WindowEvents.js";
import { Logger } from "./Logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Window {
    private key = "window-state";
    private name: string;
    private options: BrowserWindowConstructorOptions;
    private store: Store;
    private state: Rectangle | null = null;
    private window: BrowserWindow;
    public static readonly DEAFAULT_WIDTH = 1800;
    public static readonly DEFAULT_HEIGHT = 1000;
    public static appStateStore = new Store({ name: "app-state" });

    constructor(
        windowName: string,
        options: BrowserWindowConstructorOptions,
    ) {
        this.options = options;
        this.name = `window-state-${windowName}`;
        this.resetToDefaults();
        this.store = new Store({ name: this.name });

        this.restore();
        this.ensureVisibleOnSomeDisplay();

        const browserOptions: BrowserWindowConstructorOptions = {
            ...options,
            ...this.state,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: true,
                preload: path.resolve(__dirname, "..", "preload.js"),
                webSecurity: app.isPackaged,
                ...options.webPreferences,
            },
        };
        Logger.debug("Loading preload script from:", path.resolve(__dirname, "..", "preload.js"));
        this.window = new BrowserWindow(browserOptions);

        this.window.on("close", () => {
            this.saveState();
        });
        this.window.on("blur", () => {
            this.window.webContents.send("window.state.blur");
        });
        this.window.on("focus", () => {
            this.window.webContents.send("window.state.focus");
        });

        this.window.webContents.on(
            "before-input-event",
            (_event: any, input: any) => {
                if (input.control && input.shift && input.key.toLowerCase() === "i") {
                    // if (this.backend.isProduction()) return;
                    this.window.webContents.toggleDevTools();
                    _event.preventDefault();
                }
            },
        );
    }

    public setResizable(resizable: boolean): void {
        this.window.setResizable(resizable);
    }

    public restore(): void {
        this.state = this.store.get(this.key, this.state) as Rectangle;
    }

    public getCurrentPosition(): Rectangle {
        const position = this.window.getPosition();
        const size = this.window.getSize();
        return {
            x: position[0],
            y: position[1],
            width: size[0],
            height: size[1],
        };
    }

    public windowWithinBounds(bounds: Rectangle): boolean {
        return (
            this.state!.x >= bounds.x &&
            this.state!.y >= bounds.y &&
            this.state!.x + this.state!.width <= bounds.x + bounds.width &&
            this.state!.y + this.state!.height <= bounds.y + bounds.height
        );
    }

    public moveToDefaults(): void {
        this.resetToDefaults();
        this.ensureVisibleOnSomeDisplay();
        this.setBounds(this.state!);
        this.setResizable(true);
        this.saveState();
    }

    public resetToDefaults(): void {
        const isOnboardingComplete = Window.appStateStore.get("onboarding-complete", false);
        this.window?.setMinimumSize(600, 245)

        const width = isOnboardingComplete ? Window.DEAFAULT_WIDTH : WindowResizeOnboarding.WINDOW_WIDTH;
        const height = isOnboardingComplete ? Window.DEFAULT_HEIGHT : WindowResizeOnboarding.WINDOW_HEIGHT;

        const bounds = screen.getPrimaryDisplay().bounds;
        this.state = {
            x: (bounds.width - (this.options.width ?? width)) / 2,
            y: (bounds.height - (this.options.height ?? height)) / 2,
            width: Math.min(this.options.width ?? width, bounds.width),
            height: Math.min(this.options.height ?? height, bounds.height),
        };
    }

    public ensureVisibleOnSomeDisplay(): void {
        const visible = screen.getAllDisplays().some((display: any) => {
            return this.windowWithinBounds(display.bounds);
        });
        if (!visible) {
            return this.resetToDefaults();
        }
    }

    public saveState(): void {
        if (!this.window.isMinimized() && !this.window.isMaximized()) {
            Object.assign(this.state!, this.getCurrentPosition());
        }
        return this.store.set(this.key, this.state);
    }

    public setBounds(bounds: Rectangle, animated: boolean = true): void {
        this.state = bounds;
        this.window.setBounds(bounds, animated);
    }

    get windowInstance(): BrowserWindow {
        return this.window;
    }
}
