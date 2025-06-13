import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { chat } from "./chat.js";

export const message = sqliteTable("message", {
  id: integer().primaryKey({ autoIncrement: true }),
  type: text().notNull().default("user"), // 'user or 'system' or 'assistant
  content: text().notNull(),
  status: text().notNull().default("success"), // 'success' or 'pending'
  chat_id: integer().notNull().references(() => chat.id, { onDelete: 'cascade' }),
  created_at: integer({ mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: integer({ mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
  metadata: text().$type<Record<string, any>>().default({}),
})

export const message_relations = relations(message, ({ one }) => ({
  chat: one(chat, {
    fields: [message.chat_id],
    references: [chat.id],
  }),
}))