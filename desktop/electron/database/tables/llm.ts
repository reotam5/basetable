import { relations } from "drizzle-orm";
import { blob, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { agent } from "./agent.js";

export const llm = sqliteTable("llm", {
  id: integer().primaryKey({ autoIncrement: true }),
  display_name: text().notNull(), // e.g., 'GPT-3.5', 'GPT-4', etc.
  description: text().notNull(),
  provider: text().notNull(), // e.g., 'OpenAI', 'Google', etc.
  model: text().notNull(), // e.g., 'gpt-3.5-turbo', 'gpt-4', etc.
  model_path: text().notNull(), // Path to the model file
  config: blob({ mode: "json" }).$type<Record<string, any>>(),
  is_default: integer({ mode: 'boolean' }).notNull().default(false), // default llm will be used for tasks like creating chat room names
  download_url: text(),
})

export const llm_relations = relations(llm, ({ many }) => ({
  agents: many(agent)
}))