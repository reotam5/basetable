import { eq } from 'drizzle-orm';
import { database } from '../database/database.js';
import { user } from '../database/tables/user.js';
import { AuthHandler } from '../helpers/auth-handler.js';

class UserService {

  async getUserById(id: string) {
    const [userData] = await database()
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    return userData;
  }

  async getMe() {
    if (!AuthHandler.profile?.sub) {
      throw new Error("User not authenticated");
    }
    return await this.getUserById(AuthHandler.profile?.sub);
  }

  async updateMe(data: Partial<typeof user.$inferInsert>) {
    if (!AuthHandler.profile?.sub) {
      throw new Error("User not authenticated");
    }

    const updatedUser = await database()
      .update(user)
      .set(data)
      .where(eq(user.id, AuthHandler.profile.sub))
      .returning();

    return updatedUser[0];
  }

  async createUser(data: typeof user.$inferInsert) {
    const newUser = await database()
      .insert(user)
      .values(data)
      .returning()

    return newUser[0];
  }
}

const instance = new UserService();
export { instance as UserService };
