import User from "../db/models/user.model.js";
import { event, service } from "../helpers/decorators.js";

@service
export class UserService {

  @event('user.update', 'handle')
  public async updateUser(id: string, updates: {
    name?: string;
    email?: string;
    picture?: string;
  }): Promise<any | null> {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        console.error(`User with id ${id} not found`);
        return null;
      }

      await user.update(updates);
      return user.get({ plain: true });
    } catch (error) {
      console.error("Error updating user:", error);
      return null;
    }
  }

  @event('user.delete', 'handle')
  public async deleteUser(id: string): Promise<boolean> {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        console.error(`User with id ${id} not found`);
        return false;
      }

      await user.destroy();
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }
}
