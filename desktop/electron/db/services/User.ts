import { ModelCtor } from "sequelize";
import { Logger } from "../../helpers/Logger.js";
import { Database } from "../Database.js";
import { Users } from "../models/Users.js";

class UserService {
  static #instance: UserService;
  private model: ModelCtor<any> | undefined = undefined

  private constructor() { }

  public static get instance(): UserService {
    if (!UserService.#instance) {
      UserService.#instance = new UserService();
    }

    return UserService.#instance;
  }

  public initialize(): void {
    this.model = Database.sequelize?.model(Users.name);
  }

  public async getUserById(id: string): Promise<any> {
    try {
      const user = await this.model?.findOne({ where: { id } });
      if (!user) {
        return null;
      }
      return user;
    } catch (error) {
      Logger.error("Error fetching user by ID:", error);
      return null;
    }
  }

  public async createUser(data: { id?: string, name?: string, email?: string, picture?: string }): Promise<any> {
    try {
      if (!data.id || !data.name) {
        Logger.error("User creation failed: 'id' and 'name' are required.", data);
        return null;
      }
      const user = await this.model?.create(data)
      return user;
    } catch {
      return null
    }
  }
}

const userService = UserService.instance;
export { userService as UserService };
