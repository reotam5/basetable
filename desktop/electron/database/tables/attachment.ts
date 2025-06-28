import { relations, sql } from "drizzle-orm";
import { blob, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { message } from "./message.js";


export const attachment = sqliteTable("attachment", {
  id: integer().primaryKey({ autoIncrement: true }),
  message_id: integer().notNull().references(() => message.id, { onDelete: 'cascade' }),
  content: blob({ mode: "buffer" }),
  file_name: text().notNull(),
  file_type: text({ enum: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text', 'pdf'] }).notNull(),
  file_size: integer().notNull(),
  created_at: integer({ mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
})


export const attachment_relations = relations(attachment, ({ one }) => ({
  message: one(message, {
    fields: [attachment.message_id],
    references: [message.id],
  }),
}))