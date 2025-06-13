import { eq } from 'drizzle-orm';
import { database } from '../database/database.js';
import { user } from '../database/tables/user.js';

class UserService {

  async getUserById(id: string) {
    const [userData] = await database()
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    return userData;
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
