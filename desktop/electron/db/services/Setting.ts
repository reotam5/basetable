import { ModelCtor } from "sequelize";
import { AuthHandler } from "../../helpers/AuthHandler.js";
import { Logger } from "../../helpers/Logger.js";
import { Database } from "../Database.js";
import { Settings } from "../models/Settings.js";

class SettingService {
  static #instance: SettingService;
  private model: ModelCtor<any> | undefined = undefined

  private constructor() { }

  public static get instance(): SettingService {
    if (!SettingService.#instance) {
      SettingService.#instance = new SettingService();
    }

    return SettingService.#instance;
  }

  public initialize(): void {
    this.model = Database.sequelize?.model(Settings.name);
  }

  public async getSetting(key: string): Promise<any> {
    try {
      const setting = await this.model?.findOne({ where: { key, userId: AuthHandler.profile?.sub } });
      if (!setting) {
        return null;
      }
      const value = setting.value;
      if (!value) return value;
      switch (setting.type) {
        case 'date':
          return new Date(value);
        case 'array':
          return JSON.parse(value);
        case 'object':
          return JSON.parse(value);
        case 'boolean':
          return !!value;
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
          Logger.warn(`Unknown setting type: ${setting.type} for key: ${key}`);
          return value; // Fallback to returning the value as is
      }
    } catch (error) {
      Logger.error("Error fetching setting:", error);
      return null;
    }
  }

  public async setSetting(key: string, value: any): Promise<any> {
    try {
      const type = typeof value;
      let type_db: SettingType = 'string';
      if (type === 'object') {
        if (value instanceof Date) {
          value = value.toISOString();
          type_db = 'date';
        } else if (Array.isArray(value)) {
          value = JSON.stringify(value);
          type_db = 'array';
        } else if (value === null) {
          value = 'null';
          type_db = 'null';
        } else {
          value = JSON.stringify(value);
          type_db = 'object';
        }
      } else if (type === 'boolean') {
        value = !!value;
        type_db = 'boolean';
      } else if (type === 'undefined') {
        value = 'undefined';
        type_db = 'undefined';
      } else if (type === 'number') {
        value = value.toString();
        type_db = 'number';
      } else if (type === 'bigint') {
        value = value.toString();
        type_db = 'bigint';
      }

      const existingSetting = await this.model?.findOne({ where: { key, userId: AuthHandler.profile?.sub } });
      if (existingSetting) {
        existingSetting.value = value;
        existingSetting.type = type_db;
        return await existingSetting.save();
      } else {
        return await this.model?.create({
          key,
          value,
          type: type_db,
          userId: AuthHandler.profile?.sub
        });
      }
    } catch (error) {
      Logger.error("Error setting value:", error);
      return null;
    }
  }

  public async deleteSetting(key: string): Promise<void> {
    try {
      const setting = await this.model?.findOne({ where: { key, userId: AuthHandler.profile?.sub } });
      if (setting) {
        await setting.destroy();
      }
    } catch (error) {
      Logger.error("Error deleting setting:", error);
    }
  }
}

export type SettingType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date' | 'bigint' | 'undefined' | 'null';


const userService = SettingService.instance;
export { userService as SettingService };
