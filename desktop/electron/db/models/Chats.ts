import { DataTypes, Model, ModelAttributes, ModelCtor, ModelOptions, Sequelize } from "sequelize";

export const Chats: {
  name: string;
  options: ModelOptions<Model<any, any>>;
  attributes: ModelAttributes<Model<any, any>>;

  // meant for customizing models such as adding associations. This is called after all models are defined, before syncing.
  customize?: (sequelize: Sequelize) => Promise<void>;

  // meant for adding default entries to the model after logged in. This happens after every login. By using ignoreDuplicates, it will not create duplicates if the entries already exist.
  addDefaultEntries?: (model: ModelCtor<Model>, userId: string) => Promise<void>;
} = {
  name: "Chats",
  options: {
    timestamps: true,
    indexes: [
      {
        fields: ["userId", "createdAt"],
      },
    ]
  },
  attributes: {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "New Chat",
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Additional metadata like tags, categories, etc."
    }
  },
  customize: async (sequelize) => {
    const ChatModel = sequelize.model("Chats");
    const UserModel = sequelize.model("Users");
    const MessageModel = sequelize.model("Messages");

    // Associations
    ChatModel.belongsTo(UserModel, { foreignKey: "userId" });
    ChatModel.hasMany(MessageModel, { foreignKey: "chatId", onDelete: "CASCADE" });

    // Reverse associations
    UserModel.hasMany(ChatModel, { foreignKey: "userId" });
  }
};
