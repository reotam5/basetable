import ApiKey from "../db/models/api-key.model.js";
import { AuthHandler } from "../helpers/AuthHandler.js";
import { event, service } from "../helpers/decorators.js";

@service
export class APIKeyService {

  @event('apikey.set', 'handle')
  public async setKey(name: string, value: string): Promise<any | null> {
    try {
      const existingKey = await ApiKey.findOne({
        where: {
          name: name,
          userId: AuthHandler.profile?.sub
        }
      });

      if (existingKey) {
        existingKey.value = value;
        existingKey.lastUsed = new Date();
        await existingKey.save();
        return existingKey.get({ plain: true });
      } else {
        // Create new key if it doesn't exist
        const newKey = await ApiKey.create({
          name: name,
          value: value,
          userId: AuthHandler.profile!.sub,
          userMcpId: 1 // You might need to adjust this based on your business logic
        });
        return newKey.get({ plain: true });
      }
    } catch (error) {
      console.error("Error setting API key:", error);
      return null;
    }
  }

  @event('apikey.get', 'handle')
  public async getKey(name: string): Promise<any | null> {
    try {
      const key = await ApiKey.findOne({
        where: {
          name: name,
          userId: AuthHandler.profile?.sub
        }
      });

      if (key) {
        // Update last used timestamp
        key.lastUsed = new Date();
        await key.save();
        return key.get({ plain: true });
      }

      return null;
    } catch (error) {
      console.error("Error getting API key:", error);
      return null;
    }
  }

  @event('apikey.delete', 'handle')
  public async deleteKey(name: string): Promise<boolean> {
    try {
      const key = await ApiKey.findOne({
        where: {
          name: name,
          userId: AuthHandler.profile?.sub
        }
      });

      if (key) {
        await key.destroy();
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error deleting API key:", error);
      return false;
    }
  }
}


