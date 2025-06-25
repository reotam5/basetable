import { relations } from "drizzle-orm";
import { blob, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { agent_to_mcp_server } from "./agent.js";
import { api_key } from "./api-key.js";
import { user } from "./user.js";

export const mcp_server = sqliteTable("mcp_server", {
  id: integer().primaryKey({ autoIncrement: true }),
  user_id: text().notNull().references(() => user.id, { onDelete: 'cascade' }),
  type: text({ enum: ['preset', 'custom'] }).notNull(),
  name: text().notNull(),
  description: text(),
  icon: text(),
  available_tools: blob({ mode: 'json' }).$type<{ id: string, name: string, title?: string, description?: string, inputSchema?: any }[]>(),
  confirmation_bypass_tools: blob({ mode: 'json' }).$type<string[]>(),
  server_config: blob({ mode: 'json' }).$type<{
    command: string;
    args: string[];
    env?: Record<string, string>;
    cwd?: string;
  }>(),
  is_active: integer({ mode: 'boolean' }).notNull().default(false),
  is_installed: integer({ mode: 'boolean' }).notNull().default(false),
  created_at: integer({ mode: 'timestamp' }).$default(() => new Date()),
  updated_at: integer({ mode: 'timestamp' }).$default(() => new Date())
})

export const mcp_server_relations = relations(mcp_server, ({ many, one }) => ({
  many_api_keys: many(api_key),
  user: one(user, {
    fields: [mcp_server.user_id],
    references: [user.id],
  }),
  agents: many(agent_to_mcp_server)
}))
