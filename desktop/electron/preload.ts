
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
    },
    onLogoutComplete: (callback: () => void) => {
      handler.on("auth.logout.complete", callback);
      return () => {
        handler.removeEventListener("auth.logout.complete", callback);
      }
    },
  },
  window: {
    resize: {
      onboarding: () => handler.send("window.resize.onboarding"),
    }
  },
  settings: {
    get: (key: string) => handler.invoke("settings.get", key),
    set: (key: string, value: any) => handler.invoke("settings.set", key, value),
  },
  chat: {
    create: (chat: { title?: string; initialMessage?: { content: string }, metadata?: any }) => handler.invoke("chat.create", chat),
    getAll: (options?: { limit?: number; offset?: number; search?: string }) => handler.invoke("chat.getAll", options),
    getById: (id: number) => handler.invoke("chat.getById", id),
    update: (id: number, chat: { title?: string; metadata?: any }) => handler.invoke("chat.update", id, chat),
    delete: (id: number) => handler.invoke("chat.delete", id),
    search: (query: string, options?: { limit?: number; offset?: number }) => handler.invoke("chat.search", query, options),
    message: {
      create: (message: { chatId: number; type: string; content: string; status?: string }) => handler.invoke("message.create", message),
      getByChat: (chatId: number, options?: { limit?: number; offset?: number }) => handler.invoke("message.getByChat", chatId, options),
      attachment: {
        create: (attachment: { messageId: number; filePath: string; fileName: string, type: string }) => handler.invoke("attachment.create", attachment),
        getByMessage: (messageId: number) => handler.invoke("attachment.getByMessage", messageId),
      }
    },
  },
  mcp: {
    getAll: (filter?: { is_active?: boolean }) => handler.invoke("mcp.getAll", filter),
    uninstall: (name: string) => handler.invoke("mcp.uninstall", name),
    install: (name: string) => handler.invoke("mcp.install", name),
    setActiveState: (name: string, is_active: boolean) => handler.invoke("mcp.active", name, is_active),
  },
  key: {
    set: (name: string, value: string) => handler.invoke("apikey.set", name, value),
    delete: (name: string) => handler.invoke("apikey.delete", name),
  },
  agent: {
    getMain: () => handler.invoke("agent.getMain"),
    getAll: () => handler.invoke("agent.getAll"),
    delete: (id: number) => handler.invoke("agent.delete", id),
    create: (agent: { instruction: string; llmId: number; mcpIds?: number[]; styles?: number[] }) => handler.invoke("agent.create", agent),
    get: (id: number) => handler.invoke("agent.get", id),
    update: (id: number, agent?: { name?: string; instruction?: string; llmId?: number; mcpIds?: number[]; styles?: number[] }) => handler.invoke("agent.update", id, agent),
    getTones: () => handler.invoke("agent.get.tones"),
    getStyles: () => handler.invoke("agent.get.styles"),
  },
  llm: {
    getAll: () => handler.invoke("llm.getAll"),
  },
  db: {
    encryption: {
      get: () => handler.invoke("db.encryption.get"),
    },
    export: {
      applicationSettings: () => handler.invoke("db.export.applicationSettings"),
    },
    import: (data: any) => handler.invoke("db.import", data),
    reset: {
      applicationSettings: () => handler.invoke("db.reset.applicationSettings"),
    },
    onSettingsImported: (callback: () => void) => {
      handler.on("db.imported", callback);
      return () => {
        handler.removeEventListener("db.imported", callback);
      }
    }
  }
}

contextBridge.exposeInMainWorld("store", store);
contextBridge.exposeInMainWorld("electronAPI", electronAPI);

console.log("Preload script loaded successfully");

export type electronAPI = typeof electronAPI
export type BackendStore = typeof store
