import { DataTypes, Model, ModelAttributes, ModelCtor, ModelOptions, Sequelize } from "sequelize";

export const Users_MCPs: {
  name: string;
  options: ModelOptions<Model<any, any>>;
  attributes: ModelAttributes<Model<any, any>>;

  // meant for customizing models such as adding associations. This is called after all models are defined, before syncing.
  customize?: (sequelize: Sequelize) => Promise<void>;

  // meant for adding default entries to the model after logged in. This happens after every login. By using ignoreDuplicates, it will not create duplicates if the entries already exist.
  addDefaultEntries?: (model: ModelCtor<Model>, userId: string) => Promise<void>;
} = {
  name: "Users_MCPs",
  options: {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["UserId", "MCPId"],
      },
    ]
  },
  attributes: {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_installed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  customize: async (sequelize) => {
    // Users_MCPs(many) - Agents(many)
    // Users_MCPs(many) - MCPs(one)
    const Users_MCPsModel = sequelize.model("Users_MCPs");
    const AgentModel = sequelize.model("Agents");
    const MCPsModel = sequelize.model("MCPs");

    Users_MCPsModel.belongsToMany(AgentModel, { through: sequelize.model("Agents_MCPs"), foreignKey: "mcpId" });
    Users_MCPsModel.belongsTo(MCPsModel, { foreignKey: "MCPId" });

  },
  addDefaultEntries: async (model, userId) => {
    await model.bulkCreate([
      { is_active: false, is_installed: false, UserId: userId, MCPId: 1 },
      { is_active: false, is_installed: false, UserId: userId, MCPId: 2 },
      { is_active: false, is_installed: false, UserId: userId, MCPId: 3 },
      { is_active: false, is_installed: false, UserId: userId, MCPId: 4 },
      { is_active: false, is_installed: false, UserId: userId, MCPId: 5 },
      { is_active: false, is_installed: false, UserId: userId, MCPId: 6 },
      { is_active: false, is_installed: false, UserId: userId, MCPId: 7 },
      { is_active: false, is_installed: false, UserId: userId, MCPId: 8 }
    ], {
      ignoreDuplicates: true
    })
  }
};

