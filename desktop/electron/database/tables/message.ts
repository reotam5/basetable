import { relations, sql } from "drizzle-orm";
import { blob, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { chat } from "./chat.js";
import { tool_call } from "./tool-call.js";

export const message = sqliteTable("message", {
  id: integer().primaryKey({ autoIncrement: true }),
  role: text({ enum: ['system', 'user', 'assistant'] }).notNull().default("user"),
  content: text().notNull(),
  thought: text(),
  status: text({ enum: ["success", "pending", "error"] }).notNull().default("success"),
  chat_id: integer().notNull().references(() => chat.id, { onDelete: 'cascade' }),
  created_at: integer({ mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: integer({ mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
  metadata: blob({ mode: 'json' }).$type<{
    long_text_documents?: Array<{
      id: string;
      content: string;
      title: string;
    }>;
    search_results?: Array<{
      title: string;
      url: string;
    }>;
    agents?: Array<{
      name: string;
      llm: {
        display_name: string;
      }
    }>;
  }>(),
})

export const message_relations = relations(message, ({ one, many }) => ({
  chat: one(chat, {
    fields: [message.chat_id],
    references: [chat.id],
  }),
  tool_calls: many(tool_call),
}))