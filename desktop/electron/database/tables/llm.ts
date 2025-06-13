import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { agent } from "./agent.js";

export const llm = sqliteTable("llm", {
  id: integer().primaryKey({ autoIncrement: true }),
  display_name: text().notNull(), // e.g., 'GPT-3.5', 'GPT-4', etc.
  description: text().notNull(),
  provider: text().notNull(), // e.g., 'OpenAI', 'Google', etc.
  model: text().notNull(), // e.g., 'gpt-3.5-turbo', 'gpt-4', etc.
})

export const llm_relations = relations(llm, ({ many }) => ({
  agents: many(agent)
}))