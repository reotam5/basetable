import { DataTypes, Model, ModelAttributes, ModelCtor, ModelOptions, Sequelize } from "sequelize";

export const Messages: {
  name: string;
  options: ModelOptions<Model<any, any>>;
  attributes: ModelAttributes<Model<any, any>>;

  // meant for customizing models such as adding associations. This is called after all models are defined, before syncing.
  customize?: (sequelize: Sequelize) => Promise<void>;

  // meant for adding default entries to the model after logged in. This happens after every login. By using ignoreDuplicates, it will not create duplicates if the entries already exist.
  addDefaultEntries?: (model: ModelCtor<Model>, userId: string) => Promise<void>;
} = {
  name: "Messages",
  options: {
    timestamps: true,
    indexes: [
      {
        fields: ["chatId", "createdAt"],
      },
      {
        fields: ["type"],
      },
    ]
  },
  attributes: {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    chatId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Chats', key: 'id' },
    },
    type: {
      type: DataTypes.ENUM('user', 'assistant', 'system'),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'success', 'error', 'cancelled'),
      allowNull: false,
      defaultValue: 'success',
    },
  },
  customize: async (sequelize) => {
    const MessageModel = sequelize.model("Messages");
    const ChatModel = sequelize.model("Chats");
    const AttachmentModel = sequelize.model("Attachments");

    // Associations
    MessageModel.belongsTo(ChatModel, { foreignKey: "chatId" });
    MessageModel.hasMany(AttachmentModel, {
      foreignKey: "messageId",
      onDelete: "CASCADE"
    });

    // Reverse associations
    ChatModel.hasMany(MessageModel, { foreignKey: "chatId" });
  }
};
