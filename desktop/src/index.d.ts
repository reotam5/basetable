import { BackendStore, electronAPI } from "../electron/preload.js";

declare global {
  interface Window {
    electronAPI: electronAPI
    store: BackendStore
  }
}