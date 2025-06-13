import { relations } from "drizzle-orm";
import { blob, integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { agent_to_user_mcp } from "./agent.js";
import { api_key } from "./api-key.js";
import { user } from "./user.js";

export const mcp = sqliteTable("mcp", {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  description: text().notNull(),
  icon: text().notNull(),
  tools: blob({ mode: 'json' }).$type<{ name: string, id: string }[]>()
})

export const user_mcp = sqliteTable("user_mcp", {
  id: integer().primaryKey({ autoIncrement: true }),
  user_id: text().notNull().references(() => user.id, { onDelete: 'cascade' }),
  mcp_id: integer().notNull().references(() => mcp.id, { onDelete: 'cascade' }),
  is_active: integer({ mode: 'boolean' }).notNull().default(false),
  is_installed: integer({ mode: 'boolean' }).notNull().default(false),
}, (table) => ([
  unique().on(table.user_id, table.mcp_id),
]))

export const mcp_relations = relations(mcp, ({ many }) => ({
  user_mcps: many(user_mcp),
  many_api_keys: many(api_key)
}))

export const user_mcp_relations = relations(user_mcp, ({ one, many }) => ({
  user: one(user, {
    fields: [user_mcp.user_id],
    references: [user.id],
  }),
  mcp: one(mcp, {
    fields: [user_mcp.mcp_id],
    references: [mcp.id],
  }),
  agent_to_user_mcp: many(agent_to_user_mcp)
}))