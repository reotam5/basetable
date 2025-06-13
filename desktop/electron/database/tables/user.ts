import { relations } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { agent } from "./agent.js";
import { api_key } from "./api-key.js";
import { chat } from "./chat.js";
import { user_mcp } from "./mcp.js";
import { setting } from "./setting.js";

export const user = sqliteTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull(),
  picture: text().notNull(),
})

export const user_relations = relations(user, ({ many }) => ({
  user_api_keys: many(api_key),
  user_mcps: many(user_mcp),
  agents: many(agent),
  chats: many(chat),
  settings: many(setting)
}))