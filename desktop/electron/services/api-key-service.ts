import { and, eq } from 'drizzle-orm';
import { database } from '../database/database.js';
import { api_key } from '../database/tables/api-key.js';
import { mcp_server } from '../database/tables/mcp-server.js';
import { AuthHandler } from '../helpers/auth-handler.js';
import { Logger } from '../helpers/custom-logger.js';
import { event, service } from '../helpers/decorators.js';

@service
class APIKeyService {
  @event('apikey.getAll', 'handle')
  public async getKeys() {
    try {
      const keys = await database()
        .select()
        .from(api_key)
        .where(eq(api_key.user_id, AuthHandler.profile!.sub))
        .leftJoin(
          mcp_server,
          eq(api_key.mcp_server_id, mcp_server.id)
        )
        .orderBy(api_key.name);
      return keys;
    } catch (error) {
      Logger.error("Error fetching API keys:", error);
      return [];
    }
  }

  @event('apikey.set', 'handle')
  public async setKey(name: string, value: string) {
    try {
      const newKey = await database()
        .update(api_key)
        .set({
          value: value,
        })
        .where(
          and(
            eq(api_key.name, name),
            eq(api_key.user_id, AuthHandler.profile!.sub)
          )
        )
        .returning();
      return newKey[0] || null;
    } catch (error) {
      Logger.error("Error setting API key:", error);
      return null;
    }
  }

  @event('apikey.delete', 'handle')
  public async deleteKey(name: string) {
    try {
      const result = await database()
        .delete(api_key)
        .where(
          and(
            eq(api_key.name, name),
            eq(api_key.user_id, AuthHandler.profile!.sub)
          )
        );

      return result.changes > 0;
    } catch (error) {
      Logger.error("Error deleting API key:", error);
      return false;
    }
  }
}

const instance = new APIKeyService();
export { instance as APIKeyService };

