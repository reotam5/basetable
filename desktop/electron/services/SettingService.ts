import Setting from "../db/models/settings.model.js";
import { AuthHandler } from "../helpers/AuthHandler.js";
import { event, service } from "../helpers/decorators.js";

export type SettingType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date' | 'bigint' | 'undefined' | 'null';

@service
export class SettingService {

  @event('setting.get', 'handle')
  public async getSetting(key: string): Promise<any> {
    try {
      const setting = await Setting.findOne({
        where: { key, userId: AuthHandler.profile?.sub }
      });

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
          console.warn(`Unknown setting type: ${setting.type} for key: ${key}`);
          return value; // Fallback to returning the value as is
      }
    } catch (error) {
      console.error("Error fetching setting:", error);
      return null;
    }
  }

  @event('setting.set', 'handle')
  public async setSetting(key: string, value: any): Promise<any | null> {
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
        processedValue = !!value;
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

      const existingSetting = await Setting.findOne({
        where: { key, userId: AuthHandler.profile?.sub }
      });

      if (existingSetting) {
        existingSetting.value = processedValue;
        existingSetting.type = type_db;
        await existingSetting.save();
        return existingSetting.get({ plain: true });
      } else {
        const newSetting = await Setting.create({
          key,
          value: processedValue,
          type: type_db,
          userId: AuthHandler.profile!.sub
        });
        return newSetting.get({ plain: true });
      }
    } catch (error) {
      console.error("Error setting value:", error);
      return null;
    }
  }
}
