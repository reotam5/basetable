import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { message } from "./message.js";
import { tool_call } from "./tool-call.js";
import { user } from "./user.js";

export const chat = sqliteTable("chat", {
  id: integer().primaryKey({ autoIncrement: true }),
  title: text().notNull().default("New Chat"),
  created_at: integer({ mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: integer({ mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
  user_id: text().notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const chat_relations = relations(chat, ({ one, many }) => ({
  user: one(user, {
    fields: [chat.user_id],
    references: [user.id],
  }),
  messages: many(message),
  tool_calls: many(tool_call)
}))

