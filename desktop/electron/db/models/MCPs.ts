import { DataTypes, Model, ModelAttributes, ModelCtor, ModelOptions, Sequelize } from "sequelize";

export const MCPs: {
  name: string;
  options: ModelOptions<Model<any, any>>;
  attributes: ModelAttributes<Model<any, any>>;

  // meant for customizing models such as adding associations. This is called after all models are defined, before syncing.
  customize?: (sequelize: Sequelize) => Promise<void>;

  // meant for adding default entries to the model after logged in. This happens after every login. By using ignoreDuplicates, it will not create duplicates if the entries already exist.
  addDefaultEntries?: (model: ModelCtor<Model>, userId: string) => Promise<void>;
} = {
  name: "MCPs",
  options: {
    timestamps: true,
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
      unique: true,
      comment: "Name of the MCP server",
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Description of the MCP server",
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tools: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "array of string representing tools available on the MCP server",
    },
  },
  customize: async (sequelize) => {
    const UserModel = sequelize.model("Users");
    const MCPModel = sequelize.model("MCPs");
    // Define the association between MCP and Users
    MCPModel.belongsToMany(UserModel, { through: "Users_MCPs" })

    const APIKeysModel = sequelize.model("APIKeys");
    MCPModel.hasMany(APIKeysModel, {
      foreignKey: "mcpId",
    });
  },
  addDefaultEntries: async (model) => {
    await model.bulkCreate([
      { id: 1, name: "Gmail", description: "Access Gmail functionality including reading, sending, and managing emails.", tools: ["Send Email", "Read Email", "Search Email", "Manage Labels"], icon: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" },
      { id: 2, name: "Slack", description: "Integrate with Slack for messaging, and channel management.", tools: ["Send Message", "Read Messages", "Manage Channels", "Search Messages"], icon: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg" },
      { id: 3, name: "Github", description: "Connect to GitHub for repository management, issue tracking, and pull requests.", tools: ["Create Repository", "Manage Issues", "Review Pull Requests", "Search Repositories", "Code Search"], icon: "https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg" },
      { id: 4, name: "File System", description: "Interact with the local file system for file management tasks.", tools: ["Read File", "Write File", "Delete File", "List Directory", "Search Files"], icon: "https://upload.wikimedia.org/wikipedia/commons/f/f2/Folder-icon.svg" },
      { id: 5, name: "Notion", description: "Connect to Notion for managing notes, databases, and tasks.", tools: ["Create Page", "Read Page", "Update Page", "Search Pages", "Manage Databases"], icon: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png" },
      { id: 6, name: "Google Calendar", description: "Access Google Calendar for managing events and schedules.", tools: ["Create Event", "Read Events", "Update Event", "Delete Event", "Search Events"], icon: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" },
      { id: 7, name: "AWS Services", description: "Access various Amazon Web Services for cloud operations", tools: ['S3 Operations', 'Lambda Functions', 'EC2 Management', 'CloudWatch'], icon: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" },
      { id: 8, name: "PostgreSQL", description: "Connect to PostgreSQL databases for data management and queries.", tools: ["Execute Query", "Read Data", "Insert Data", "Update Data", "Delete Data"], icon: "https://upload.wikimedia.org/wikipedia/commons/2/29/Postgresql_elephant.svg" },
    ], {
      ignoreDuplicates: true,
    })
  }
};
