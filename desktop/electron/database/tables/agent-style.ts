import { relations } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { agent } from "./agent.js";

export const agent_style = sqliteTable("agent_style", {
  id: integer().primaryKey({ autoIncrement: true }),
  type: text().notNull(), // 'style' or 'tone'
  name: text().notNull(),
  description: text().notNull(),
})

export const agent_to_agent_style = sqliteTable("agent_to_agent_style", {
  agent_id: integer().notNull().references(() => agent.id, { onDelete: 'cascade' }),
  agent_style_id: integer().notNull().references(() => agent_style.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.agent_id, table.agent_style_id] }),
])

export const agent_style_relations = relations(agent_style, ({ many }) => ({
  agent_to_agent_styles: many(agent_to_agent_style),
}))

export const agent_to_agent_style_relations = relations(agent_to_agent_style, ({ one }) => ({
  agent: one(agent, {
    fields: [agent_to_agent_style.agent_id],
    references: [agent.id],
  }),
  agent_style: one(agent_style, {
    fields: [agent_to_agent_style.agent_style_id],
    references: [agent_style.id],
  }),
}))