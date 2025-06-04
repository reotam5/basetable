import { Op } from "sequelize";
import Attachment from "../db/models/attachment.model.js";
import Chat from "../db/models/chat.model.js";
import Message from "../db/models/message.model.js";
import { AuthHandler } from "../helpers/AuthHandler.js";
import { event, service } from "../helpers/decorators.js";

@service
export class ChatService {

  // Chat management
  @event('chat.create', 'handle')
  public async createChat(data: {
    title?: string;
    initialMessage?: {
      content: string;
    };
    metadata?: any;
  }): Promise<any | null> {
    try {
      const chat = await Chat.create({
        title: data.title || `New Chat ${Date.now()}`,
        userId: AuthHandler.profile!.sub,
        lastMessageAt: new Date(),
        metadata: data.metadata || {},
      });

      if (data.initialMessage) {
        await this.createMessage({
          chatId: chat.id!,
          type: 'user',
          content: data.initialMessage.content,
          status: 'success',
        });
      }

      return await this.getChatById(chat.id!);
    } catch (error) {
      console.error("Error creating chat:", error);
      return null;
    }
  }

  @event('chat.getAll', 'handle')
  public async getChats(options: {
    limit?: number;
    offset?: number;
    search?: string;
  } = {}): Promise<{ rows: any[]; count: number }> {
    try {
      const whereClause: any = {
        userId: AuthHandler.profile?.sub,
      };

      if (options.search) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${options.search}%` } },
        ];
      }

      const { rows, count } = await Chat.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Message,
            limit: 1,
            order: [['createdAt', 'DESC']],
            required: false,
          },
        ],
        limit: options.limit || 50,
        offset: options.offset || 0,
        order: [['lastMessageAt', 'DESC']],
      });

      return {
        rows: rows.map(chat => chat.get({ plain: true })),
        count,
      };
    } catch (error) {
      console.error("Error fetching chats:", error);
      return { rows: [], count: 0 };
    }
  }

  @event('chat.getById', 'handle')
  public async getChatById(chatId: number): Promise<any | null> {
    try {
      const chat = await Chat.findOne({
        where: { id: chatId, userId: AuthHandler.profile?.sub },
        include: [
          {
            model: Message,
            include: [
              {
                model: Attachment,
                required: false,
              }
            ],
            order: [['createdAt', 'ASC']],
          },
        ],
      });

      return chat ? chat.get({ plain: true }) : null;
    } catch (error) {
      console.error("Error fetching chat by ID:", error);
      return null;
    }
  }

  @event('chat.update', 'handle')
  public async updateChat(chatId: number, updates: {
    title?: string;
    metadata?: any;
  }): Promise<boolean> {
    try {
      const [affectedRows] = await Chat.update(updates, {
        where: { id: chatId, userId: AuthHandler.profile?.sub },
      });

      return affectedRows > 0;
    } catch (error) {
      console.error("Error updating chat:", error);
      return false;
    }
  }

  @event('chat.delete', 'handle')
  public async deleteChat(chatId: number): Promise<boolean> {
    try {
      const deletedRows = await Chat.destroy({
        where: { id: chatId, userId: AuthHandler.profile?.sub },
      });

      return deletedRows > 0;
    } catch (error) {
      console.error("Error deleting chat:", error);
      return false;
    }
  }

  // Message management
  @event('message.create', 'handle')
  public async createMessage(data: {
    chatId: number;
    type: 'user' | 'assistant' | 'system';
    content: string;
    status?: string;
  }): Promise<any | null> {
    try {
      const chat = await Chat.findOne({
        where: { id: data.chatId, userId: AuthHandler.profile?.sub },
      });

      if (!chat) {
        throw new Error("Chat not found or you do not have permission to access it.");
      }

      const message = await Message.create({
        chatId: data.chatId,
        type: data.type,
        content: data.content,
        status: (data.status as any) || 'success',
      });

      // Update chat's lastMessageAt
      await Chat.update(
        { lastMessageAt: new Date() },
        { where: { id: data.chatId } },
      );

      const createdMessage = await Message.findOne({
        where: { id: message.id },
        include: [
          {
            model: Attachment,
            required: false,
          }
        ]
      });

      return createdMessage ? createdMessage.get({ plain: true }) : null;
    } catch (error) {
      console.error("Error creating message:", error);
      return null;
    }
  }

  @event('message.getByChatId', 'handle')
  public async getMessagesByChat(chatId: number, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<{ rows: any[]; count: number }> {
    try {
      // First verify the chat belongs to the user
      const chat = await Chat.findOne({
        where: { id: chatId, userId: AuthHandler.profile?.sub },
      });

      if (!chat) {
        return { rows: [], count: 0 };
      }

      const { rows, count } = await Message.findAndCountAll({
        where: { chatId },
        include: [
          {
            model: Attachment,
            required: false,
          }
        ],
        limit: options.limit || 100,
        offset: options.offset || 0,
        order: [['createdAt', 'DESC']],
      });

      return {
        rows: rows.map(message => message.get({ plain: true })),
        count,
      };
    } catch (error) {
      console.error("Error fetching messages by chat:", error);
      return { rows: [], count: 0 };
    }
  }

  // Attachment management
  @event('attachment.create', 'handle')
  public async createAttachment(data: {
    messageId: number;
    filename: string;
    type: string;
    filePath: string;
  }): Promise<any | null> {
    try {
      const attachment = await Attachment.create({
        messageId: data.messageId.toString(),
        filename: data.filename,
        type: data.type as any,
        filePath: data.filePath,
      });

      return attachment.get({ plain: true });
    } catch (error) {
      console.error("Error creating attachment:", error);
      return null;
    }
  }

  @event('attachment.getByMessageId', 'handle')
  public async getAttachmentsByMessage(messageId: number): Promise<any[]> {
    try {
      const attachments = await Attachment.findAll({
        where: { messageId: messageId.toString() },
      });

      return attachments.map(attachment => attachment.get({ plain: true }));
    } catch (error) {
      console.error("Error fetching attachments by message:", error);
      return [];
    }
  }

  // Search functionality
  @event('chat.search', 'handle')
  public async searchChats(query: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    try {
      const searchQuery = `%${query}%`;
      const limit = options.limit || 20;
      const offset = options.offset || 0;

      // Search chats by title
      const chatsByTitle = await Chat.findAll({
        where: {
          userId: AuthHandler.profile?.sub,
          title: { [Op.like]: searchQuery },
        },
        include: [
          {
            model: Message,
            required: false,
          },
        ],
        limit,
        order: [['lastMessageAt', 'DESC']],
        offset,
      });

      // Search chats by message content
      const chatsByMessage = await Chat.findAll({
        where: {
          userId: AuthHandler.profile?.sub,
        },
        include: [
          {
            model: Message,
            where: {
              content: { [Op.like]: searchQuery },
            },
            required: true,
          },
        ],
        limit,
        order: [['lastMessageAt', 'DESC']],
        offset,
      });

      // Combine results and remove duplicates
      const allChats = [...chatsByTitle, ...chatsByMessage];
      const uniqueChats = allChats.filter((chat, index, self) =>
        index === self.findIndex(c => c.id === chat.id)
      );

      // Sort by lastMessageAt and apply limit
      const sortedChats = uniqueChats
        .sort((a, b) => {
          const aTime = new Date(a.lastMessageAt!).getTime();
          const bTime = new Date(b.lastMessageAt!).getTime();
          return bTime - aTime;
        })
        .slice(0, limit);

      return sortedChats.map(chat => chat.get({ plain: true }));
    } catch (error) {
      console.error("Error searching chats:", error);
      return [];
    }
  }
}
