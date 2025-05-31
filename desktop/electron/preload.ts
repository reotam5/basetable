
const { contextBridge, ipcRenderer } = require("electron");
const Store = require("electron-store");

console.log("Preload script loading...");

const handler = {
  send(channel: string, value?: unknown): void {
    ipcRenderer.send(channel, value);
  },

  on(channel: string, callback: (...args: any[]) => void): () => void {
    const subscription = (_event: any, ...args: any[]): void => {
      callback(args);
    };
    ipcRenderer.on(channel, subscription);

    return (): void => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },

  once(channel: string, callback: (...args: any[]) => void): () => void {
    const subscription = (_event: any, ...args: any[]): void => {
      callback(args);
    };
    ipcRenderer.once(channel, subscription);

    return (): void => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },

  invoke(channel: string, ...args: any[]): Promise<any> {
    return ipcRenderer.invoke(channel, ...args);
  },

  removeEventListener(
    channel: string,
    callback: (...args: any[]) => void,
  ): void {
    ipcRenderer.removeListener(channel, callback);
  },

  removeAllListeners(channel: string): void {
    ipcRenderer.removeAllListeners(channel);
  },
};

const store = {
  createStore(options: any): {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
    delete: (key: string) => void;
    clear: () => void;
  } {
    const createdStore = new Store(options);

    return {
      get: (key: string): any => {
        return createdStore.get(key);
      },
      set: (key: string, value: any) => createdStore.set(key, value),
      delete: (key: string) => createdStore.delete(key),
      clear: () => createdStore.clear(),
    };
  },
};

const electronAPI = {
  auth: {
    login: (silent: boolean = false) => handler.invoke("auth.login", silent),
    logout: () => handler.send("auth.logout"),
    profile: () => handler.invoke("auth.profile"),
    accessToken: () => handler.invoke("auth.accessToken"),
    onLoginComplete: (callback: (...args: any[]) => void) => {
      handler.on("auth.login.complete", callback);
      return () => {
        handler.removeEventListener("auth.login.complete", callback);
      }
    }
  },
  window: {
    resize: {
      onboarding: () => handler.send("window.resize.onboarding"),
    }
  }
}

contextBridge.exposeInMainWorld("store", store);
contextBridge.exposeInMainWorld("electronAPI", electronAPI);

console.log("Preload script loaded successfully");

export type electronAPI = typeof electronAPI
export type BackendStore = typeof store
