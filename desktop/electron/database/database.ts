import DB from 'better-sqlite3-multiple-ciphers';
import crypto from "crypto";
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { app } from 'electron';
import path, { join } from 'path';
import { fileURLToPath } from 'url';
import { Logger } from '../helpers/custom-logger.js';
import { KeyManager } from '../helpers/key-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Database {
  public drizzle!: BetterSQLite3Database<Record<string, never>>;
  private sqlite!: InstanceType<typeof DB>

  public async initialize() {
    const existingPassword = await KeyManager.getKey(KeyManager.KEYS.DB_PASSWORD);
    const strongPassword = crypto.randomBytes(16).toString('base64').slice(0, 16);
    if (!existingPassword) {
      KeyManager.setKey(KeyManager.KEYS.DB_PASSWORD, strongPassword);
    }
    const password = existingPassword || strongPassword;
    if (!password) {
      throw new Error("Password creation failed before initializing the database.");
    }

    this.sqlite = new DB(join(app.getPath("userData"), "basetable.db"));

    // set encryption if production
    if (app.isPackaged) this.sqlite.pragma(`key='${password}'`);

    this.drizzle = drizzle(this.sqlite);

    try {
      migrate(this.drizzle, { migrationsFolder: __dirname + '/migrations' });
    } catch (error) {
      Logger.error("Migration failed:", error);
    }
  }

  public async close() {
    try {
      this.sqlite.close();
      Logger.info("Database connection closed successfully.");
    } catch (error) {
      Logger.error("Error closing the database:", error);
    }
  }
}

const instance = new Database();
const database = () => instance.drizzle;
export default instance
export { database };
