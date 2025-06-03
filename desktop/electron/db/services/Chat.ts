import { Model, ModelCtor, Op } from "sequelize";
import { AuthHandler } from "../../helpers/AuthHandler.js";
import { Logger } from "../../helpers/Logger.js";
import { Database } from "../Database.js";

class ChatService {
  static #instance: ChatService;
  private chatModel: ModelCtor<Model> | undefined = undefined;
  private messageModel: ModelCtor<Model> | undefined = undefined;
  private attachmentModel: ModelCtor<Model> | undefined = undefined;

  private constructor() { }

  public static get instance(): ChatService {
    if (!ChatService.#instance) {
      ChatService.#instance = new ChatService();
    }

    return ChatService.#instance;
  }

  public initialize(): void {
    this.chatModel = Database.sequelize!.model("Chats");
    this.messageModel = Database.sequelize!.model("Messages");
    this.attachmentModel = Database.sequelize!.model("Attachments");
  }

  // Chat management
  public async createChat(data: {
    title?: string;
    initialMessage?: {
      content: string;
    };
    metadata?: any;
  }) {
    try {
      const chat = await this.chatModel?.create({
        title: data.title || `New Chat ${Date.now()} (we should auto generate this)`,
        userId: AuthHandler.profile?.sub,
        lastMessageAt: new Date(),
        metadata: data.metadata || {},
      });
      if (data.initialMessage) {
        await this.createMessage({
          chatId: chat?.get('id') as number,
          type: 'user',
          content: data.initialMessage.content,
          status: 'success',
        });
      }
      return await this.getChatById(chat?.get('id') as number);
    } catch (error) {
      Logger.error("Error creating chat:", error);
      return null;
    }
  }

  public async getChats(options: {
    limit?: number;
    offset?: number;
    search?: string;
  } = {}) {
    const whereClause: any = {
      userId: AuthHandler.profile?.sub,
    };

    if (options.search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${options.search}%` } },
      ];
    }

    const include: any[] = [
      {
        model: this.messageModel,
        limit: 1,
        order: [['createdAt', 'DESC']],
        required: false,
      },
    ];

    const { rows, count } = (await this.chatModel?.findAndCountAll({
      where: whereClause,
      include,
      limit: options.limit || 50,
      offset: options.offset || 0,
      order: [['lastMessageAt', 'DESC']],
    })) || { rows: [], count: 0 };
    return {
      rows: rows.map(chat => chat.get({ plain: true })),
      count,
    }
  }

  public async getChatById(chatId: number) {
    return (await this.chatModel?.findOne({
      where: { id: chatId, userId: AuthHandler.profile?.sub },
      include: [
        {
          model: this.messageModel,
          include: [
            {
              model: this.attachmentModel,
              required: false,
            }
          ],
          order: [['createdAt', 'ASC']],
        },
      ],
    }))?.get({ plain: true });
  }

  public async updateChat(chatId: number, updates: {
    title?: string;
    metadata?: any;
  }) {
    return await this.chatModel?.update(updates, {
      where: { id: chatId, userId: AuthHandler.profile?.sub },
    });
  }

  public async deleteChat(chatId: number) {
    return await this.chatModel?.destroy({
      where: { id: chatId, userId: AuthHandler.profile?.sub },
    });
  }

  // Message management
  public async createMessage(data: {
    chatId: number;
    type: 'user' | 'assistant' | 'system';
    content: string;
    status?: string;
  }) {
    const chat = await this.chatModel?.findOne({
      where: { id: data.chatId, userId: AuthHandler.profile?.sub },
    })
    if (!chat) {
      throw new Error("Chat not found or you do not have permission to access it.");
    }

    const message = await this.messageModel?.create(data);

    // Update chat's lastMessageAt
    await this.chatModel?.update(
      { lastMessageAt: new Date() },
      { where: { id: data.chatId } },
    );

    return (await this.messageModel?.findOne({
      where: { id: message?.get('id') },
      include: [
        {
          model: this.attachmentModel,
          required: false,
        }
      ]
    }))?.get({ plain: true });
  }

  public async getMessagesByChat(chatId: number, options: {
    limit?: number;
    offset?: number;
  } = {}) {
    const include: any[] = [
      {
        model: this.chatModel,
        required: true,
        where: { userId: AuthHandler.profile?.sub, id: chatId },
        attributes: [],
      },
      {
        model: this.attachmentModel,
        required: false,
      }
    ];

    const { rows, count } = (await this.messageModel?.findAndCountAll({
      where: { chatId },
      include,
      limit: options.limit || 100,
      offset: options.offset || 0,
      order: [['createdAt', 'DESC']],
    })) || { rows: [], count: 0 };
    return {
      rows: rows.map(message => message.get({ plain: true })),
      count,
    };
  }

  // Attachment management
  public async createAttachment(data: {
    messageId: number;
    filename: string;
    type: string;
    filePath: string;
  }) {
    return await this.attachmentModel?.create(data);
  }

  public async getAttachmentsByMessage(messageId: number) {
    return (await this.attachmentModel?.findAll({
      where: { messageId },
    }))?.map(attachment => attachment.get({ plain: true }));
  }

  // Search functionality
  public async searchChats(query: string, options: {
    limit?: number;
    offset?: number;
  } = {}) {
    const searchQuery = `%${query}%`;
    const limit = options.limit || 20;
    const offset = options.offset || 0;

    // Search chats by title
    const chatsByTitle = await this.chatModel?.findAll({
      where: {
        userId: AuthHandler.profile?.sub,
        title: { [Op.like]: searchQuery },
      },
      include: [
        {
          model: this.messageModel,
          required: false,
        },
      ],
      limit,
      order: [['lastMessageAt', 'DESC']],
      offset,
    });

    // Search chats by message content
    const chatsByMessage = await this.chatModel?.findAll({
      where: {
        userId: AuthHandler.profile?.sub,
      },
      include: [
        {
          model: this.messageModel,
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
    const allChats = [...(chatsByTitle || []), ...(chatsByMessage || [])];
    const uniqueChats = allChats.filter((chat, index, self) =>
      index === self.findIndex(c => c.get('id') === chat.get('id'))
    );

    // Sort by lastMessageAt and apply limit
    const sortedChats = uniqueChats
      .sort((a, b) => {
        const aTime = new Date(a.get('lastMessageAt') as string).getTime();
        const bTime = new Date(b.get('lastMessageAt') as string).getTime();
        return bTime - aTime;
      })
      .slice(0, limit);

    return sortedChats.map(chat => chat.get({ plain: true }));
  }
}


const service = ChatService.instance;
export { service as ChatService };
