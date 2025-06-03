import { DataTypes, Model, ModelAttributes, ModelCtor, ModelOptions, Sequelize } from "sequelize";

// API keys used by MCP servers
export const APIKeys: {
  name: string;
  options: ModelOptions<Model<any, any>>;
  attributes: ModelAttributes<Model<any, any>>;

  // meant for customizing models such as adding associations. This is called after all models are defined, before syncing.
  customize?: (sequelize: Sequelize) => Promise<void>;

  // meant for adding default entries to the model after logged in. This happens after every login. By using ignoreDuplicates, it will not create duplicates if the entries already exist.
  addDefaultEntries?: (model: ModelCtor<Model>, userId: string) => Promise<void>;
} = {
  name: "APIKeys",
  options: {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["name", "userId"],
      },
    ],
  },
  attributes: {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastUsed: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
    mcpId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'MCPs', key: 'id' },
    }
  },
  addDefaultEntries: async (model, userId) => {
    await model.bulkCreate([
      { id: 1, name: "Gmail API Key", value: "YOUR_GMAIL_API_KEY", userId: userId, mcpId: 1 },
      { id: 2, name: "Slack API Key", value: "YOUR_SLACK_API_KEY", userId: userId, mcpId: 2 },
      { id: 3, name: "GitHub API Key", value: "YOUR_GITHUB_API_KEY", userId: userId, mcpId: 3 },
      { id: 4, name: "Notion API Key", value: "YOUR_NOTION_API_KEY", userId: userId, mcpId: 5 },
      { id: 5, name: "Google Calendar API Key", value: "YOUR_GOOGLE_CALENDAR_API_KEY", userId: userId, mcpId: 6 },
      { id: 6, name: "AWS Access Key", value: "YOUR_AWS_ACCESS_KEY", userId: userId, mcpId: 7 },
      { id: 7, name: "PostgreSQL Connection String", value: "YOUR_POSTGRESQL_CONNECTION_STRING", userId: userId, mcpId: 8 }
    ], {
      ignoreDuplicates: true
    });
  }
};

