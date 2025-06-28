import { and, desc, eq, inArray, ne } from 'drizzle-orm';
import { fileTypeFromFile } from 'file-type';
import fs from 'fs';
import { database } from '../database/database.js';
import { attachment } from '../database/tables/attachment.js';
import { chat } from '../database/tables/chat.js';
import { message } from '../database/tables/message.js';
import { tool_call } from '../database/tables/tool-call.js';
import { Logger } from '../helpers/custom-logger.js';
import { event, service } from '../helpers/decorators.js';
import { getFileInfo } from '../helpers/file-processor.js';
import { MCPClient } from '../helpers/mcp-client.js';
import { Content, Message } from '../helpers/remote-llm-model.js';
@service
class MessageService {

  @event('message.getByChatId', 'handle')
  public async getMessagesByChatId(chatId: number, limit?: number) {
    try {
      const query = database()
        .select()
        .from(message)
        .leftJoin(
          tool_call,
          eq(message.id, tool_call.message_id),
        )
        .leftJoin(
          attachment,
          eq(message.id, attachment.message_id),
        )
        .where(and(
          eq(message.chat_id, chatId),
        ))
        .orderBy(
          desc(message.created_at),
          desc(tool_call.created_at),
        )

      if (limit) {
        query.limit(limit);
      }
      const rows = await query;

      const result = rows.reduce<Record<number, {
        message: typeof message.$inferSelect;
        toolCalls: typeof tool_call.$inferSelect[],
        attachments?: (Omit<typeof attachment.$inferSelect, 'content'> & { content?: string })[];
      }>>(
        (acc, row) => {
          const message = row.message;
          const toolCall = row.tool_call;
          const attachment = row.attachment;

          if (!acc[message.id]) {
            acc[message.id] = { message, toolCalls: [], attachments: [] };
          }
          if (toolCall) {
            acc[message.id].toolCalls.unshift(toolCall);
          }
          if (attachment) {
            acc[message.id].attachments?.push({
              ...attachment,
              content: attachment.file_type === 'text' ? attachment.content?.toString() : attachment.content?.toString('base64')
            });
          }
          return acc;
        },
        {}
      );
      return Object.values(result).sort((a, b) => b.message!.created_at!.getTime() - a.message!.created_at!.getTime());
    } catch (error) {
      Logger.error("Error fetching messages:", error);
      throw error;
    }
  }

  async updateChatUpdatedAt(chatId: number) {
    try {
      const [updatedChat] = await database()
        .update(chat)
        .set({
          updated_at: new Date(),
        })
        .where(eq(chat.id, chatId))
        .returning();
      return updatedChat;
    } catch (error) {
      Logger.error("Failed to update chat updated_at:", error);
      throw error;
    }
  }


  /**
   * converts getMessagesByChatId output to the format that backend expects. 
   */
  async getMessagesForBackend(chatId: number, limit: number = 50): Promise<Message[]> {
    try {
      const dbMessages = await this.getMessagesByChatId(chatId, limit);
      const result: Message[] = [];

      for (const { message, toolCalls, attachments } of dbMessages.reverse()) {

        const parts: Content = [];

        if (message.thought && message.thought.trim()) {
          parts.push({
            type: 'think',
            body: message.thought,
          })
        }

        if (attachments && attachments.length > 0) {
          const attachmentParts = attachments?.map(att => {
            const fileType = att.file_type?.split('/')?.[0]
            return {
              type: fileType === 'image' ? 'image' : fileType === 'text' ? 'text' : 'file',
              body: fileType === 'text' ?
                "```" + att.file_name +
                att.content +
                "```"
                : att.content,
              media_type: fileType === 'image' ? att.file_type?.split('/')?.[1] : undefined, // image/png -> png
            } as Content[number]
          }) ?? [];

          for (const att of attachmentParts) {
            parts.push(att);
          }
        }

        result.push({
          role: message.role,
          content: [...parts, ...(message.content ? [{ type: 'text', body: message.content }] as Content : [])],
          tool_calls: toolCalls.map(toolCall => ({
            id: toolCall.tool_call_id!,
            tool_type: 'function',
            call: {
              name: toolCall.function_name,
              arg: toolCall.function_args ?? ""
            },
          })) ?? []
        })

        if (toolCalls.length > 0) {
          result.push({
            role: 'user',
            content: toolCalls?.reverse().map(tc => ({
              type: 'tool',
              body: tc.function_return ?? "",
              tool_call_id: tc.tool_call_id!,
            }))
          })
        }
      }

      return result
    } catch (error) {
      Logger.error("Failed to get recent messages:", error);
      throw error;
    }
  }

  /**
   * gets latest non-error message for the chat.
   * used to maintain message flow. 
   */
  async getLastMessage(chatId: number): Promise<typeof message.$inferSelect | null> {
    try {
      const result = await database()
        .select()
        .from(message)
        .where(and(
          eq(message.chat_id, chatId),
          ne(message.status, 'error')
        ))
        .orderBy(desc(message.created_at))
        .limit(1);

      if (result.length === 0) return null;

      return result[0];
    } catch (error) {
      Logger.error("Failed to get last message:", error);
      throw error;
    }
  }

  async storeAttachment(messageId: number, file: { path: string }) {
    try {
      const type = await fileTypeFromFile(file.path);
      const info = getFileInfo(file.path.split('/').pop() || 'unknown', type?.mime || 'unknown', fs.statSync(file.path).size, fs.readFileSync(file.path));

      if (info.error) {
        throw new Error(info.error);
      }

      const { fileType, size } = info.info!;

      const [newAttachment] = await database()
        .insert(attachment)
        .values({
          message_id: messageId,
          file_type: fileType,
          file_name: file.path.split('/').pop() || 'unknown',
          file_size: size,
          content: fs.readFileSync(file.path),
        })
        .returning();
      return newAttachment;
    } catch (error) {
      Logger.error("Failed to store attachment:", error);
      throw error;
    }
  }

  /**
   * When creating user message, it should follow the last assistant message that was successful.
   * If theres no last message, this is new chat 
   */
  async storeUserMessage(chatId: number, content: string, attachments?: Array<{ path: string }>, metadata: typeof message.$inferInsert['metadata'] = {}) {
    await this.updateChatUpdatedAt(chatId);

    const lastMessage = await this.getLastMessage(chatId);

    if (!lastMessage || (lastMessage && lastMessage.role === 'assistant' && lastMessage.status === 'success')) {
      const [newMessage] = await database()
        .insert(message)
        .values({
          chat_id: chatId,
          role: 'user',
          content: content,
          status: 'success',
          metadata: metadata,
        })
        .returning();

      try {
        // create attachment
        if (attachments && attachments.length > 0) {
          for (const attachment of attachments) {
            await this.storeAttachment(newMessage.id, attachment);
          }
        }
      } catch {
        await this.deleteMessageById(newMessage.id);
        throw new Error("Failed to store attachments for the user message. Message was not created.");
      }

      const [result] = await this.getMessagesByChatId(chatId, attachments?.length);
      return result
    }

    throw new Error("You shouldn't be here. Broken message flow. User message should follow success assistant message.");
  }

  /**
   * When creating assistant message, look for empty assistant message that merge into (thought creates empty assistant message). 
   * Make sure that this empty assistant messages is in pending state.
   * Otherwise, simply create new assistant message
   */
  async storeAssistantMessage(chatId: number, content: string, metadata: typeof message.$inferInsert['metadata'] = {}) {
    await this.updateChatUpdatedAt(chatId);

    const lastMessage = await this.getLastMessage(chatId);

    // thought message is hanging
    if (lastMessage && lastMessage.role === 'assistant' && lastMessage.status === 'pending' && !lastMessage.content.trim()) {
      const [updatedMessage] = await database()
        .update(message)
        .set({
          content: content,
          status: 'success',
          updated_at: new Date(),
          metadata: metadata,
        })
        .where(eq(message.id, lastMessage.id))
        .returning();
      return updatedMessage;
    }

    const [newMessage] = await database()
      .insert(message)
      .values({
        chat_id: chatId,
        role: 'assistant',
        content: content,
        status: 'success',
        metadata: metadata,
      })
      .returning();
    return newMessage;
  }

  /**
   * When creating thought, create empty assistant message below. 
   * Thought and the placeholder assistant message should be pending until assistant message is completed  
   */
  async storeThoughtMessage(chatId: number, content: string) {
    await this.updateChatUpdatedAt(chatId);

    const [assistantThought] = await database()
      .insert(message)
      .values({
        chat_id: chatId,
        role: 'assistant',
        content: '',
        thought: content,
        status: 'pending',
      })
      .returning();

    return assistantThought;
  }


  /**
   * When creating tool, look if above message is assistant message. If so, connect. 
   * Otherwise create empty assistant messages above to link it. The empty assistant message can be made as success state
   */
  async storeToolCall(toolCall: Omit<typeof tool_call.$inferInsert, 'message_id'>) {
    try {
      await this.updateChatUpdatedAt(toolCall.chat_id);

      let lastMessage = await this.getLastMessage(toolCall.chat_id);

      if (!lastMessage || lastMessage.role !== 'assistant') {
        // If the last message is not an assistant message, create an empty assistant message
        const [newAssistantMessage] = await database()
          .insert(message)
          .values({
            chat_id: toolCall.chat_id,
            role: 'assistant',
            content: '',
            status: 'success',
          })
          .returning();

        lastMessage = newAssistantMessage;
      }

      if (!lastMessage) {
        throw new Error("Failed to find or create an assistant message to link tool call.");
      }

      if (lastMessage.status == 'pending' && lastMessage.role === 'assistant') {
        await database()
          .update(message)
          .set({
            status: 'success',
            updated_at: new Date(),
          })
          .where(eq(message.id, lastMessage.id));
      }

      const [newToolCall] = await database()
        .insert(tool_call)
        .values({
          ...toolCall,
          message_id: lastMessage.id,
        })
        .returning();

      return { linkedMessage: lastMessage, toolCall: newToolCall };
    } catch (error) {
      Logger.error("Failed to store tool calls:", error);
      throw error;
    }
  }

  async saveToolCallResponse(id: number, result: Awaited<ReturnType<InstanceType<typeof MCPClient>['callTool']>>, executionStartTime: Date, executionEndTime: Date) {
    const [toolCall] = await database()
      .update(tool_call)
      .set({
        status: (!result || result?.isError) ? 'error' : 'executed',
        function_return: result?.content ? JSON.stringify(result.content ?? {}) : null,
        updated_at: new Date(),
        execution_start_at: executionStartTime,
        execution_end_at: executionEndTime,
      })
      .where(eq(tool_call.id, id))
      .returning();
    return toolCall;
  }

  async rejectToolCall(id: number) {
    const [toolCall] = await database()
      .update(tool_call)
      .set({
        status: 'rejected',
        function_return: "Tool call was rejected by user",
        updated_at: new Date(),
      })
      .where(eq(tool_call.id, id))
      .returning();
    return toolCall;
  }

  async getToolCallById(id: number): Promise<typeof tool_call.$inferSelect | null> {
    const result = await database()
      .select()
      .from(tool_call)
      .where(eq(tool_call.id, id))
      .limit(1);

    if (result.length === 0) return null;

    return result[0];
  }

  async getPendingToolCalls(chatId: number): Promise<typeof tool_call.$inferSelect[]> {
    try {
      const result = await database()
        .select()
        .from(tool_call)
        .where(and(
          eq(tool_call.chat_id, chatId),
          eq(tool_call.status, 'pending_confirmation'),
        ))
        .orderBy(desc(tool_call.created_at));

      return result;
    } catch (error) {
      Logger.error("Failed to get hanging tool calls:", error);
      throw error;
    }
  }

  async deleteMessageById(id: number): Promise<void> {
    try {
      // First, delete associated tool calls
      await database()
        .delete(tool_call)
        .where(eq(tool_call.message_id, id));

      // Then, delete the message itself
      await database()
        .delete(message)
        .where(eq(message.id, id));
    } catch (error) {
      Logger.error("Failed to delete message by ID:", error);
      throw error;
    }
  }

  async deleteUntilLastSuccessMessage(chatId: number): Promise<void> {
    try {
      // fetch the messages to find the last successful one
      const messages = await this.getMessagesByChatId(chatId);
      if (messages.length === 0) return;

      // Find the index of the last successful message
      const lastSuccessIndex = messages.findIndex(msg => msg.message.status === 'success');

      // Get the IDs of messages to delete
      const messageIdsToDelete = messages.slice(0, lastSuccessIndex).map(msg => msg.message.id);

      if (messageIdsToDelete.length === 0) return; // Nothing to delete

      // delete associated tool calls
      await database()
        .delete(tool_call)
        .where(inArray(tool_call.message_id, messageIdsToDelete));

      // Delete messages and tool calls
      await database()
        .delete(message)
        .where(inArray(message.id, messageIdsToDelete));

    } catch (error) {
      Logger.error("Failed to delete messages until last success:", error);
      throw error;
    }
  }
}

const instance = new MessageService();
export { instance as MessageService };
