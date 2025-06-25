import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { chat } from "./chat.js";
import { mcp_server } from "./mcp-server.js";
import { message } from "./message.js";

export const tool_call = sqliteTable("tool_call", {
  id: integer().primaryKey({ autoIncrement: true }),
  tool_call_id: text(), // this is the id of the execution, it is used for remote model to identify the tool call in the LLM model response
  chat_id: integer().notNull().references(() => chat.id, { onDelete: 'no action' }),
  message_id: integer().notNull().references(() => message.id, { onDelete: 'no action' }),
  mcp_server_id: integer().references(() => mcp_server.id, { onDelete: 'no action' }),
  status: text({ enum: ["pending_confirmation", "ready_to_be_executed", "executed", "rejected", "error"] }).notNull(),
  function_name: text().notNull(), // this references mcp tabble, tools column, id attribute. when llm model calls this tool, they call it as `user_mcp_id__function_name`
  function_args: text(),
  function_return: text(),
  execution_start_at: integer({ mode: 'timestamp_ms' }),
  execution_end_at: integer({ mode: 'timestamp_ms' }),
  created_at: integer({ mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: integer({ mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
})


export const tool_call_relations = relations(tool_call, ({ one }) => ({
  chat: one(chat, {
    fields: [tool_call.chat_id],
    references: [chat.id],
  }),
  message: one(message, {
    fields: [tool_call.message_id],
    references: [message.id],
  }),
  mcp_server: one(mcp_server, {
    fields: [tool_call.mcp_server_id],
    references: [mcp_server.id],
  }),
}))