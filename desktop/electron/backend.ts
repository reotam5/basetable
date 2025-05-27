import { app } from 'electron';
import { join } from 'path';
import { Window } from './helpers/index.js';

export class Backend {
    private readonly isProd: boolean = app.isPackaged;
    private mainWindow: Window | null = null;

    public static main(): Backend {
        return new Backend();
    }

    public constructor() {
        if (!this.isProd) {
            app.setPath('userData', `${app.getPath('userData')} (non-production)`);
        }

        app.on('window-all-closed', () => {
            app.quit();
        });

        app.once('ready', async () => {
            await this.start();
        });
    }

    private async start(): Promise<void> {
        this.mainWindow = new Window(this, 'controller', {
            width: 800,
            height: 600,
            minWidth: 800,
            minHeight: 600,
        });

        if (this.isProd) {
            this.mainWindow.windowInstance.loadFile(join(app.getAppPath(), "dist/react/index.html"));
        } else {
            this.mainWindow.windowInstance.loadURL('http://localhost:3000')
        }
    }

    public isProduction(): boolean {
        return this.isProd;
    }
}