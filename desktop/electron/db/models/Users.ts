import { DataTypes, Model, ModelAttributes, ModelCtor, ModelOptions, Sequelize } from "sequelize";

export const Users: {
  name: string;
  options: ModelOptions<Model<any, any>>;
  attributes: ModelAttributes<Model<any, any>>;

  // meant for customizing models such as adding associations. This is called after all models are defined, before syncing.
  customize?: (sequelize: Sequelize) => Promise<void>;

  // meant for adding default entries to the model after logged in. This happens after every login. By using ignoreDuplicates, it will not create duplicates if the entries already exist.
  addDefaultEntries?: (model: ModelCtor<Model>, userId: string) => Promise<void>;
} = {
  name: "Users",
  options: {
    timestamps: true,
  },
  attributes: {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
    },
    picture: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  },
  customize: async (sequelize) => {
    const UserModel = sequelize.model("Users");
    const MCPModel = sequelize.model("MCPs");
    // Define the association between MCP and Users
    UserModel.belongsToMany(MCPModel, { through: "Users_MCPs" })
  }
}
