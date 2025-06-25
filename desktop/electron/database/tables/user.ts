import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { agent } from "./agent.js";
import { api_key } from "./api-key.js";
import { chat } from "./chat.js";
import { mcp_server } from "./mcp-server.js";
import { setting } from "./setting.js";

export const user = sqliteTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull(),
  picture: text().notNull(),
  saw_model_download: integer({ mode: 'boolean' }).default(false),
})

export const user_relations = relations(user, ({ many }) => ({
  user_api_keys: many(api_key),
  mcp_server: many(mcp_server),
  agents: many(agent),
  chats: many(chat),
  settings: many(setting)
}))