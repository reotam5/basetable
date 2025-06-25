import { relations } from "drizzle-orm";
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { mcp_server } from "./mcp-server.js";
import { user } from "./user.js";

export const api_key = sqliteTable("api_key", {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  value: text().notNull(),
  last_used: integer({ mode: 'timestamp' }),
  user_id: text().notNull().references(() => user.id, { onDelete: 'cascade' }),
  mcp_server_id: integer().notNull().references(() => mcp_server.id, { onDelete: 'cascade' }),
}, (table) => [
  unique().on(table.user_id, table.name)
])

export const api_key_relations = relations(api_key, ({ one }) => ({
  user: one(user, {
    fields: [api_key.user_id],
    references: [user.id],
  }),
  mcp_server: one(mcp_server, {
    fields: [api_key.mcp_server_id],
    references: [mcp_server.id],
  })
}))
