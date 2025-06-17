import { backend } from "../backend.js";

export function navigate(path: string) {
  backend.getMainWindow()?.windowInstance.webContents.send("window.navigate", path);
}