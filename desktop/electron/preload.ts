
import { contextBridge, ipcRenderer } from "electron";
import Store from "electron-store";
import { AuthAccessToken, AuthLogin, AuthProfile } from "./events/auth-events";
import { DatabaseGetEncryption } from "./events/database-events";
import { PaymentPurchase } from "./events/payment-events";
import { AgentService, AgentStyleService, APIKeyService, ChatService, LLMService, MCPService, MessageService, SettingService } from "./services";

console.log("Preload script loading...");

const handler = {
  send(channel: string, value?: unknown): void {
    ipcRenderer.send(channel, value);
  },

  on(channel: string, callback: (...args: any[]) => void): () => void {
    const subscription = (_event: any, ...args: any[]): void => {
      callback(...args);
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
    login: (silent: boolean = false) => handler.invoke("auth.login", silent) as ReturnType<typeof AuthLogin.prototype.execute>,
    logout: () => handler.send("auth.logout"),
    profile: () => handler.invoke("auth.profile") as ReturnType<typeof AuthProfile.prototype.execute>,
    accessToken: () => handler.invoke("auth.accessToken") as ReturnType<typeof AuthAccessToken.prototype.execute>,
    onLoginComplete: (callback: (...args: any[]) => void) => handler.on("auth.login.complete", callback),
    onLogoutComplete: (callback: () => void) => handler.on("auth.logout.complete", callback),
  },
  window: {
    resize: {
      onboarding: () => handler.send("window.resize.onboarding"),
    },
  },
  payment: {
    purchase: (amount: number) => handler.invoke("payment.purchase", amount) as ReturnType<typeof PaymentPurchase.prototype.execute>,
    onPurchaseCallback: (callback: (data: { session_id: string; credits: number; success: boolean }) => void) => handler.on("payment.callback", callback),
  },
  settings: {
    get: (key: string) => handler.invoke("setting.get", key) as ReturnType<typeof SettingService.getSetting>,
    set: (key: string, value: any) => handler.invoke("setting.set", key, value) as ReturnType<typeof SettingService.setSetting>,
  },
  stream: {
    start: (options: { streamId: string; channel: string; data?: any }) => handler.invoke("stream.start", options),
    cancel: (streamId: string) => handler.invoke("stream.cancel", streamId),
    pause: (streamId: string) => handler.invoke("stream.pause", streamId),
    resume: (streamId: string) => handler.invoke("stream.resume", streamId),
    isStreaming: (streamId: string) => handler.invoke("stream.isStreaming", streamId),
    onData: (callback: (streamData: any) => void) => handler.on("stream.data", callback)
  },
  chat: {
    create: (chat: { title?: string; metadata?: any }) => handler.invoke("chat.create", chat) as ReturnType<typeof ChatService.createChat>,
    getAll: (options?: { limit?: number; offset?: number; search?: string }) => handler.invoke("chat.getAll", options) as ReturnType<typeof ChatService.getChats>,
    getById: (id: number) => handler.invoke("chat.getById", id) as ReturnType<typeof ChatService.getChatById>,
    update: (id: number, chat: { title?: string; metadata?: any }) => handler.invoke("chat.update", id, chat) as ReturnType<typeof ChatService.updateChat>,
    delete: (id: number) => handler.invoke("chat.delete", id) as ReturnType<typeof ChatService.deleteChat>,
    onTitleUpdate: (callback: (chatId: number, title: string) => void) => handler.on("chat.titleUpdate", callback),
    message: {
      getByChat: (chatId: number) => handler.invoke("message.getByChatId", chatId) as ReturnType<typeof MessageService.getMessagesByChatId>,
    },
  },
  mcp: {
    getAll: (filter?: { is_active?: boolean }) => handler.invoke("mcp.getAll", filter) as ReturnType<typeof MCPService.getMCPs>,
    uninstall: (name: string) => handler.invoke("mcp.uninstall", name) as ReturnType<typeof MCPService.uninstallMCP>,
    install: (name: string) => handler.invoke("mcp.install", name) as ReturnType<typeof MCPService.installMCP>,
    setActiveState: (name: string, is_active: boolean) => handler.invoke("mcp.setActiveState", name, is_active) as ReturnType<typeof MCPService.setActiveState>,
  },
  key: {
    getAll: () => handler.invoke("apikey.getAll") as ReturnType<typeof APIKeyService.getKeys>,
    set: (name: string, value: string) => handler.invoke("apikey.set", name, value) as ReturnType<typeof APIKeyService.setKey>,
    delete: (name: string) => handler.invoke("apikey.delete", name) as ReturnType<typeof APIKeyService.deleteKey>,
  },
  agent: {
    getMain: () => handler.invoke("agent.getMain") as ReturnType<typeof AgentService.getMainAgent>,
    getAll: () => handler.invoke("agent.getAll") as ReturnType<typeof AgentService.getAllAgents>,
    delete: (id: number) => handler.invoke("agent.delete", id) as ReturnType<typeof AgentService.deleteAgent>,
    create: (agent: { instruction: string; llmId: number; mcpTools?: { [serverId: number]: string[] }; styles?: number[] }) => handler.invoke("agent.create", agent) as ReturnType<typeof AgentService.createAgent>,
    get: (id: number) => handler.invoke("agent.getById", id) as ReturnType<typeof AgentService.getAgentById>,
    update: (id: number, agent?: { name?: string; instruction?: string; llmId?: number; mcpTools?: { [serverId: number]: string[] }; styles?: number[] }) => handler.invoke("agent.update", id, agent) as ReturnType<typeof AgentService.updateAgent>,
    getTones: () => handler.invoke("agentStyle.getTones") as ReturnType<typeof AgentStyleService.getTones>,
    getStyles: () => handler.invoke("agentStyle.getStyles") as ReturnType<typeof AgentStyleService.getStylesOnly>,
    onNameUpdate: (callback: (agentId: number, name: string) => void) => handler.on("agent.nameUpdate", callback),
  },
  llm: {
    getAll: () => handler.invoke("llm.getAll") as ReturnType<typeof LLMService.getLLMs>,
  },
  db: {
    encryption: {
      get: () => handler.invoke("db.encryption.get") as ReturnType<typeof DatabaseGetEncryption.prototype.execute>,
    },
    export: {
      applicationSettings: () => handler.invoke("setting.export.application") as ReturnType<typeof SettingService.exportApplicationSettings>,
    },
    import: (data: any) => handler.invoke("setting.import.application", data) as ReturnType<typeof SettingService.importApplicationSettings>,
    reset: {
      applicationSettings: () => handler.invoke("setting.reset.application") as ReturnType<typeof SettingService.resetApplicationSettings>,
    },
    onSettingsImported: (callback: () => void) => handler.on("db.imported", callback)
  },
}

contextBridge.exposeInMainWorld("store", store);
contextBridge.exposeInMainWorld("electronAPI", electronAPI);

console.log("Preload script loaded successfully");

export type electronAPI = typeof electronAPI
export type BackendStore = typeof store
