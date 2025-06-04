import crypto from "crypto";
import { app } from "electron";
import path, { join } from "path";
import { Sequelize } from 'sequelize-typescript';
import { fileURLToPath } from "url";
import { AuthHandler, KeyManager, Window } from "../helpers/index.js";
import { Logger } from "../helpers/Logger.js";
import { services } from "../services/index.js";
import { MigrationRunner } from "./migrations/MigrationRunner.js";
import { migrations } from "./migrations/versions/index.js";
import Setting from "./models/settings.model.js";
import { seedDefaultSettings } from "./seeder.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Database {
  public static readonly DB_IMPORTED_EVENT = "db.imported";
  static #instance: Database;
  public sequelize: Sequelize | null = null;
  private window: Window | null = null;
  private migrationRunner: MigrationRunner | null = null;

  private constructor() { }

  public static get instance(): Database {
    if (!Database.#instance) {
      Database.#instance = new Database();
    }

    return Database.#instance;
  }

  public async initialize(window: Window): Promise<void> {
    this.window = window;
    const existingPassword = await KeyManager.getKey(KeyManager.KEYS.DB_PASSWORD);
    const strongPassword = crypto.randomBytes(16).toString('base64').slice(0, 16);
    if (!existingPassword) {
      KeyManager.setKey(KeyManager.KEYS.DB_PASSWORD, strongPassword);
    }
    const password = existingPassword || strongPassword;
    if (!password) {
      throw new Error("Password creation failed before initializing the database.");
    }

    this.sequelize = new Sequelize('db', 'username', password, {
      dialect: 'sqlite',
      dialectModulePath: '@journeyapps/sqlcipher',
      storage: join(app.getPath("userData"), "db.sqlite"),
      // logging: (msg: string) => Logger.debug(msg),
      logging: false,
      models: [__dirname + '/models']
    });

    // Initialize migration runner
    this.migrationRunner = new MigrationRunner(this.sequelize);
    this.migrationRunner.registerMigrations(migrations);
  }

  public async getEncryption(): Promise<string | null> {
    return await KeyManager.getKey(KeyManager.KEYS.DB_PASSWORD);
  } public async registerModel() {
    if (!this.sequelize) {
      throw new Error("Database not initialized. Call initialize() first.");
    }

    // Run migrations automatically before model registration
    await this.ensureDatabaseIsUpToDate();

    try {
      await this.sequelize.sync();
    } catch (error) {
      Logger.error("Failed to sync database models:", error);
    }
  }

  /**
   * Automatically check and run pending migrations
   */
  private async ensureDatabaseIsUpToDate(): Promise<void> {
    if (!this.migrationRunner) {
      Logger.warn("Migration runner not initialized, skipping migration check");
      return;
    }

    try {
      Logger.info("Checking for pending database migrations...");

      // Get installation info for better logging
      const info = await this.migrationRunner.getInstallationInfo();
      Logger.info(`Installation info: isFresh=${info.isFreshInstall}, tables=${info.existingTables.length}, pending=${info.migrationStatus.pending.length}`);

      if (info.migrationStatus.pending.length > 0 || info.isFreshInstall) {
        if (info.isFreshInstall) {
          Logger.info("Fresh installation detected - migrations will be marked as executed after model sync");
        } else {
          Logger.info(`Found ${info.migrationStatus.pending.length} pending migration(s). Running automatically...`);
        }

        await this.migrationRunner.runMigrations();
        Logger.info("Database migrations completed successfully");
      } else {
        Logger.info("Database is up to date, no migrations needed");
      }
    } catch (error) {
      Logger.error("Failed to run database migrations:", error);
    }
  }

  public async registerService() {
    if (!this.sequelize) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    for (const service of services) {
      // this will load up the decorators and register the service to ipcMain
      new service()
    }
  }

  public async close(): Promise<void> {
    await this.sequelize?.close();
    this.sequelize = null;
  }

  public async exportApplicationSettings(): Promise<any> {
    if (!this.sequelize) {
      throw new Error("Database not initialized. Call initialize() first.");
    }

    try {
      const userSettings = await Setting.findAll({
        where: { userId: AuthHandler.profile?.sub },
        attributes: {
          exclude: ['id', 'userId', 'createdAt', 'updatedAt']
        }
      });

      return {
        version: "1.0",
        exportDate: new Date().toISOString(),
        type: "application_settings",
        data: {
          settings: JSON.parse(JSON.stringify(userSettings))
        }
      };
    } catch (error) {
      Logger.error("Failed to export application settings:", error);
      throw error;
    }
  }

  public async importSettings(settingsData: any): Promise<void> {
    if (!this.sequelize) {
      throw new Error("Database not initialized. Call initialize() first.");
    }

    if (!settingsData || !settingsData.data || !settingsData.version || !settingsData.type) {
      throw new Error("Invalid data format. Expected structure with data object.");
    }

    if (settingsData.type === "application_settings") {
      await this.loadApplicationSettings(settingsData);
    }

    this.window?.windowInstance.webContents.send(Database.DB_IMPORTED_EVENT)
  }

  public async loadApplicationSettings(settingsData: any): Promise<void> {
    if (!this.sequelize) {
      throw new Error("Database not initialized. Call initialize() first.");
    }

    try {
      // Validate the settings data structure
      if (!settingsData || !settingsData.data || !settingsData.data.settings) {
        throw new Error("Invalid settings data format. Expected structure with data.settings array.");
      }

      if (settingsData.type !== "application_settings") {
        throw new Error("Invalid settings data type. Expected 'application_settings'.");
      }

      // Process each setting from the import
      const settingsToImport = settingsData.data.settings;

      for (const setting of settingsToImport) {
        // Validate required fields
        if (!setting.key || !setting.type) {
          Logger.warn(`Skipping invalid setting entry: missing key, or type`);
          continue;
        }

        try {
          // Use upsert to update existing settings or create new ones
          await Setting.upsert({
            key: setting.key,
            value: setting.value,
            type: setting.type,
            userId: AuthHandler.profile?.sub,
          });

        } catch (error) {
          Logger.warn(`Failed to import setting ${setting.key}:`, error);
        }
      }

    } catch (error) {
      Logger.error("Failed to load application settings:", error);
      throw error;
    }
  }

  public async resetApplicationSettings(): Promise<void> {
    if (!this.sequelize) {
      throw new Error("Database not initialized. Call initialize() first.");
    }

    try {
      await Setting.destroy({
        where: { userId: AuthHandler.profile?.sub }
      });
      await seedDefaultSettings()
      this.window?.windowInstance.webContents.send(Database.DB_IMPORTED_EVENT)
    } catch (error) {
      Logger.error("Failed to reset application settings:", error);
      throw error;
    }
  }


}

const database = Database.instance;
export { database as Database };
