import { relations, sql } from "drizzle-orm";
import { blob, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { agent_to_agent_style } from "./agent-style.js";
import { llm } from "./llm.js";
import { user_mcp } from "./mcp.js";
import { user } from "./user.js";

export const agent = sqliteTable("agent", {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  is_main: integer({ mode: 'boolean' }).notNull().default(false),
  instruction: text().notNull(),
  user_id: text().notNull().references(() => user.id, { onDelete: 'cascade' }),
  llm_id: integer().notNull().references(() => llm.id, { onDelete: 'no action' }),
  created_at: text().default(sql`(CURRENT_TIMESTAMP)`),
})

export const agent_to_user_mcp = sqliteTable("agent_to_user_mcp", {
  agent_id: integer().notNull().references(() => agent.id, { onDelete: 'cascade' }),
  user_mcp_id: integer().notNull().references(() => user_mcp.id, { onDelete: 'cascade' }),
  selected_tools: blob({ mode: 'json' }).$type<string[]>(),
}, (table) => ([
  primaryKey({ columns: [table.agent_id, table.user_mcp_id] }),
]));

export const agent_relations = relations(agent, ({ one, many }) => ({
  user: one(user, {
    fields: [agent.user_id],
    references: [user.id],
  }),
  agent_to_agent_styles: many(agent_to_agent_style),
  llm: one(llm, {
    fields: [agent.llm_id],
    references: [llm.id],
  }),
  user_mcps: many(agent_to_user_mcp),
}))
