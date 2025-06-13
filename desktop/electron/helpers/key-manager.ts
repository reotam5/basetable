import { app } from 'electron';
import keytar from 'keytar';

enum KEYS {
  REFRESH_TOKEN,
  DB_PASSWORD,
}

class KeyManager {
  static #instance: KeyManager;
  private serviceName: string | null = null;
  public readonly KEYS = KEYS;

  private constructor() { }

  public static get instance(): KeyManager {
    if (!KeyManager.#instance) {
      KeyManager.#instance = new KeyManager();
    }

    return KeyManager.#instance;
  }

  public initialize(serviceName: string): void {
    this.serviceName = serviceName;
  }

  async setKey(name: KEYS, value: string): Promise<void> {
    await keytar.setPassword(this.serviceName!, name.toString(), value);
  }

  async getKey(name: KEYS): Promise<string | null> {
    return await keytar.getPassword(this.serviceName!, name.toString());
  }

  async deleteKey(name: KEYS): Promise<void> {
    await keytar.deletePassword(this.serviceName!, name.toString());
  }
}

const keyManager = KeyManager.instance;
keyManager.initialize(`basetable${app.isPackaged ? '' : '-dev'}`);

export { keyManager as KeyManager };
