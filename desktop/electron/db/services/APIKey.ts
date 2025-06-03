import { ModelCtor } from "sequelize";
import { AuthHandler } from "../../helpers/AuthHandler.js";
import { Database } from "../Database.js";
import { APIKeys } from "../models/APIKeys.js";

class APIKeyService {
  static #instance: APIKeyService;
  private model: ModelCtor<any> | undefined = undefined

  private constructor() { }

  public static get instance(): APIKeyService {
    if (!APIKeyService.#instance) {
      APIKeyService.#instance = new APIKeyService();
    }

    return APIKeyService.#instance;
  }

  public initialize(): void {
    this.model = Database.sequelize?.model(APIKeys.name);
  }

  public async setKey(name: string, value: string): Promise<any> {
    try {
      if (!this.model) {
        throw new Error("MCP model is not initialized.");
      }
      const key = await this.model.findOne({
        where: {
          name: name,
          userId: AuthHandler.profile?.sub
        }
      })
      if (key) {
        key.value = value;
        return await key.save();
      }
    } catch {
      return null
    }
  }

  public async deleteKey(name: string): Promise<any> {
    try {
      if (!this.model) {
        throw new Error("MCP model is not initialized.");
      }
      const key = await this.model.findOne({
        where: {
          name: name,
          userId: AuthHandler.profile?.sub
        }
      })
      if (key) {
        return await key.destroy();
      }
    } catch {
      return null
    }
  }
}

const service = APIKeyService.instance;
export { service as APIKeyService };


