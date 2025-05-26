const { contextBridge, ipcRenderer } = require("electron");
const Store = require("electron-store");

console.log("Preload script loading...");
console.log("Preload script loading...");

const handler = {
  send(channel: string, value: unknown): void {
    ipcRenderer.send(channel, value);
  },

  on(channel: string, callback: (...args: unknown[]) => void): () => void {
    const subscription = (_event: any, ...args: unknown[]): void => {
      callback(args);
    };
    ipcRenderer.on(channel, subscription);

    return (): void => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },

  once(channel: string, callback: (...args: unknown[]) => void): () => void {
    const subscription = (_event: any, ...args: unknown[]): void => {
      callback(args);
    };
    ipcRenderer.once(channel, subscription);

    return (): void => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },

  removeEventListener(
    channel: string,
    callback: (...args: unknown[]) => void,
  ): void {
    ipcRenderer.removeListener(channel, callback);
  },

  removeAllListeners(channel: string): void {
    ipcRenderer.removeAllListeners(channel);
  },
};

const auth = {
  openAuthUrl(): void {
    console.log("Preload: openAuthUrl called");
    ipcRenderer.send("open-auth-url");
  },

  onAuthCallback(
    callback: (data: {
      token?: string;
      error?: string;
      state?: string;
    }) => void,
  ): () => void {
    const subscription = (
      _event: any,
      data: { token?: string; error?: string; state?: string },
    ): void => {
      callback(data);
    };
    ipcRenderer.on("auth-callback", subscription);

    return (): void => {
      ipcRenderer.removeListener("auth-callback", subscription);
    };
  },
};

const store = {
  createStore(options: any): {
    get: (key: string) => unknown;
    set: (key: string, value: unknown) => void;
    delete: (key: string) => void;
    clear: () => void;
  } {
    const createdStore = new Store(options);

    return {
      get: (key: string): unknown => {
        return createdStore.get(key);
      },
      set: (key: string, value: unknown) => createdStore.set(key, value),
      delete: (key: string) => createdStore.delete(key),
      clear: () => createdStore.clear(),
    };
  },
};

contextBridge.exposeInMainWorld("store", store);
contextBridge.exposeInMainWorld("ipc", handler);
contextBridge.exposeInMainWorld("auth", auth);

console.log("Preload script loaded successfully, auth exposed:", !!auth);

// Types are only needed for TypeScript compilation, not runtime
