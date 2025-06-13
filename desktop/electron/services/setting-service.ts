import { and, eq } from 'drizzle-orm';
import { backend } from '../backend.js';
import { database } from '../database/database.js';
import { seedDefaultSettings } from '../database/seeder.js';
import { setting } from '../database/tables/setting.js';
import { AuthHandler } from '../helpers/auth-handler.js';
import { Logger } from '../helpers/custom-logger.js';
import { event, service } from '../helpers/decorators.js';

export type SettingType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date' | 'bigint' | 'undefined' | 'null';

@service
class SettingService {

  @event('setting.get', 'handle')
  public async getSetting(key: string) {
    try {
      const s = await database()
        .select()
        .from(setting)
        .where(and(
          eq(setting.key, key),
          eq(setting.user_id, AuthHandler.profile!.sub)
        ))

      if (s.length === 0) {
        return null;
      }

      const value = s[0].value as string;
      if (!value) return value;

      switch (s[0].type) {
        case 'date':
          return new Date(value);
        case 'array':
          return JSON.parse(value);
        case 'object':
          return JSON.parse(value);
        case 'boolean':
          return value === 'true' || value === '1';
        case 'null':
          return null;
        case 'undefined':
          return undefined;
        case 'bigint':
          return BigInt(value);
        case 'number':
          return Number(value);
        case 'string':
          return value;
        default:
          console.warn(`Unknown setting type: ${setting.type} for key: ${key}`);
          return value; // Fallback to returning the value as is
      }
    } catch (error) {
      console.error("Error fetching setting:", error);
      return null;
    }
  }

  @event('setting.set', 'handle')
  public async setSetting(key: string, value: any): Promise<{ id: number; key: string; value: string | null; type: string; user_id: string; } | null> {
    try {
      const type = typeof value;
      let type_db: SettingType = 'string';
      let processedValue = value;

      if (type === 'object') {
        if (value instanceof Date) {
          processedValue = value.toISOString();
          type_db = 'date';
        } else if (Array.isArray(value)) {
          processedValue = JSON.stringify(value);
          type_db = 'array';
        } else if (value === null) {
          processedValue = 'null';
          type_db = 'null';
        } else {
          processedValue = JSON.stringify(value);
          type_db = 'object';
        }
      } else if (type === 'boolean') {
        processedValue = value ? 'true' : 'false';
        type_db = 'boolean';
      } else if (type === 'undefined') {
        processedValue = 'undefined';
        type_db = 'undefined';
      } else if (type === 'number') {
        processedValue = value.toString();
        type_db = 'number';
      } else if (type === 'bigint') {
        processedValue = value.toString();
        type_db = 'bigint';
      }

      const [newSetting] = await database()
        .insert(setting)
        .values({
          key,
          value: processedValue,
          type: type_db,
          user_id: AuthHandler.profile!.sub
        })
        .onConflictDoUpdate({
          target: [setting.key, setting.user_id],
          set: {
            value: processedValue,
            type: type_db
          }
        })
        .returning();

      return newSetting;
    } catch (error) {
      Logger.error("Error setting setting:", error);
      return null;
    }
  }

  @event('setting.export.application', 'handle')
  public async exportApplicationSettings() {
    try {
      const settings = await database()
        .select({
          key: setting.key,
          value: setting.value,
          type: setting.type
        })
        .from(setting)
        .where(eq(setting.user_id, AuthHandler.profile!.sub));

      return {
        version: "1.0",
        exportDate: new Date().toISOString(),
        type: "application_settings",
        data: {
          settings: settings.map(s => ({
            key: s.key,
            value: s.value,
            type: s.type
          }))
        }
      };
    } catch (error) {
      Logger.error("Failed to export application settings:", error);
      throw error;
    }
  }

  @event('setting.import.application', 'handle')
  public async importApplicationSettings(settingsData: Awaited<ReturnType<typeof this.exportApplicationSettings>>) {
    if (!settingsData || !settingsData.data || !settingsData.data.settings || !settingsData.version || !settingsData.type) {
      throw new Error("Invalid data format. Expected structure with data.settings array.");
    }

    if (settingsData.type !== "application_settings") {
      throw new Error("Invalid settings data type. Expected 'application_settings'.");
    }

    try {
      for (const setting of settingsData.data.settings) {
        if (!setting.key || !setting.type) {
          Logger.warn(`Skipping invalid setting entry: missing key or type`);
          continue;
        }

        await this.setSetting(setting.key, setting.value);
      }

      backend.getMainWindow()?.windowInstance.webContents.send('db.imported');
    } catch (error) {
      Logger.error("Error importing application settings:", error);
      throw error;
    }
  }

  @event('setting.reset.application', 'handle')
  public async resetApplicationSettings() {
    try {
      await database()
        .delete(setting)
        .where(eq(setting.user_id, AuthHandler.profile!.sub));

      await seedDefaultSettings();

      backend.getMainWindow()?.windowInstance.webContents.send('db.imported');
    } catch (error) {
      Logger.error("Failed to reset application settings:", error);
      throw error;
    }
  }

}

const instance = new SettingService();
export { instance as SettingService };

