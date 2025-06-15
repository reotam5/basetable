import { relations } from "drizzle-orm";
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { user_mcp } from "./mcp.js";
import { user } from "./user.js";

export const api_key = sqliteTable("api_key", {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  value: text().notNull(),
  last_used: integer({ mode: 'timestamp' }),
  user_id: text().notNull().references(() => user.id, { onDelete: 'cascade' }),
  user_mcp_id: integer().notNull().references(() => user_mcp.id, { onDelete: 'cascade' }),
}, (table) => [
  unique().on(table.user_id, table.name)
])

export const api_key_relations = relations(api_key, ({ one }) => ({
  user: one(user, {
    fields: [api_key.user_id],
    references: [user.id],
  }),
  user_mcp: one(user_mcp, {
    fields: [api_key.user_mcp_id],
    references: [user_mcp.id],
  })
}))
