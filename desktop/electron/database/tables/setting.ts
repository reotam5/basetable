import { relations } from "drizzle-orm";
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { user } from "./user.js";

export const setting = sqliteTable("setting", {
  id: integer().primaryKey({ autoIncrement: true }),
  key: text().notNull(),
  value: text(),
  type: text().notNull(), // date", "array", "object", "boolean", "null", "undefined", "bigint", "number", "string
  user_id: text().notNull().references(() => user.id, { onDelete: 'cascade' }),
}, (table) => [
  unique().on(table.user_id, table.key)
])

export const setting_relations = relations(setting, ({ one }) => ({
  user: one(user, {
    fields: [setting.user_id],
    references: [user.id],
  })
}))