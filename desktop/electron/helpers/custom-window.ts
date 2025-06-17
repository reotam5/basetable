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
import { Logger } from "./custom-logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Window {
    private key = "window-state";
    private name: string;
    private store: Store;
    private state: Rectangle | null = null;
    private window: BrowserWindow;
    public static readonly DEAFAULT_WIDTH = 1800;
    public static readonly DEFAULT_HEIGHT = 1000;
    public static appStateStore = new Store({ name: "app-state" });
    private saveOnClose: boolean = false;

    constructor(
        windowName: string,
        options: BrowserWindowConstructorOptions,
    ) {
        this.name = `window-state-${windowName}`;
        this.store = new Store({ name: this.name });

        const browserOptions: BrowserWindowConstructorOptions = {
            ...options,
            ...this.state,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: true,
                preload: path.resolve(__dirname, "..", "preload.cjs"),
                webSecurity: app.isPackaged,
                ...options.webPreferences,
            },
        };
        Logger.debug("Loading preload script from:", path.resolve(__dirname, "..", "preload.js"));
        this.window = new BrowserWindow(browserOptions);

        this.window.on("close", () => {
            if (this.saveOnClose) {
                this.saveState();
            }
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

    public setWindowPosition(data: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        center?: boolean;
        resizable?: boolean;
        save?: boolean;
        animated?: boolean;
    }) {
        const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

        const width = data.width ?? this.getCurrentPosition().width ?? Window.DEAFAULT_WIDTH;
        const height = data.height ?? this.getCurrentPosition().height ?? Window.DEFAULT_HEIGHT;

        const targetX = (screenWidth - width) / 2;
        const targetY = (screenHeight - height) / 2;

        this.window.setBounds({
            x: data.center ? targetX : data.x ?? this.getCurrentPosition().x,
            y: data.center ? targetY : data.y ?? this.getCurrentPosition().y,
            width: width,
            height: height,
        }, data.animated);
        if (data.resizable !== undefined) {
            this.window.setResizable(data.resizable);
        }
        if (data.save) {
            const { x, y, height, width } = this.getCurrentPosition();
            this.state = {
                x: x ?? 0,
                y: y ?? 0,
                width: width ?? Window.DEAFAULT_WIDTH,
                height: height ?? Window.DEFAULT_HEIGHT,
            };
            this.saveState();
        }
        this.saveOnClose = data.save ?? false;
    }

    public restore(): void {
        this.state = this.store.get(this.key, this.state) as Rectangle;
        this.setWindowPosition({
            x: this.state?.x,
            y: this.state?.y,
            width: this.state?.width ?? Window.DEAFAULT_WIDTH,
            height: this.state?.height ?? Window.DEFAULT_HEIGHT,
            center: (this.state?.x || this.state?.y) ? false : true,
            resizable: true,
            save: true,
            animated: true,
        });
    }

    private getCurrentPosition(): Rectangle {
        const position = this.window.getPosition();
        const size = this.window.getSize();
        return {
            x: position[0],
            y: position[1],
            width: size[0],
            height: size[1],
        };
    }

    private saveState(): void {
        if (!this.window.isMinimized() && !this.window.isMaximized()) {
            Object.assign(this.state!, this.getCurrentPosition());
        }
        return this.store.set(this.key, this.state);
    }

    get windowInstance(): BrowserWindow {
        return this.window;
    }
}
