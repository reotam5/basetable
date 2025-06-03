import { DataTypes, Model, ModelAttributes, ModelCtor, ModelOptions, Sequelize } from "sequelize";
import { Agents_MCPs } from "./Agents_MCPs.js";
import { Agents_Styles } from "./Agents_Styles.js";

export const Agents: {
  name: string;
  options: ModelOptions<Model<any, any>>;
  attributes: ModelAttributes<Model<any, any>>;

  // meant for customizing models such as adding associations. This is called after all models are defined, before syncing.
  customize?: (sequelize: Sequelize) => Promise<void>;

  // meant for adding default entries to the model after logged in. This happens after every login. By using ignoreDuplicates, it will not create duplicates if the entries already exist.
  addDefaultEntries?: (model: ModelCtor<Model>, userId: string) => Promise<void>;
} = {
  name: "Agents",
  options: {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["name", "userId"],
      },
    ]
  },
  attributes: {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_main: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    instruction: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
    llmId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'LLMs', key: 'id' },
    },
  },
  customize: async (sequelize) => {
    // Agents(many) - Users(one)
    // Agents(many) - LLMs(one) 
    // Agents(many) - Users_MCPs(many)
    // Agents(many) - Styles(many)
    const AgentModel = sequelize.model("Agents");
    const UserModel = sequelize.model("Users");
    const LLMModel = sequelize.model("LLMs");
    const Users_MCPsModel = sequelize.model("Users_MCPs");
    const StylesModel = sequelize.model("Styles");

    AgentModel.belongsTo(UserModel, { foreignKey: "userId" });
    AgentModel.belongsTo(LLMModel, { foreignKey: "llmId" });
    AgentModel.belongsToMany(Users_MCPsModel, { through: sequelize.model(Agents_MCPs.name), foreignKey: "agentId" });
    AgentModel.belongsToMany(StylesModel, { through: sequelize.model(Agents_Styles.name), foreignKey: "agentId" });
  },
  addDefaultEntries: async (model, userId) => {
    await model.bulkCreate([
      { name: "Main Agent", is_main: true, instruction: null, userId: userId, llmId: 1 },
    ], {
      ignoreDuplicates: true,
    })
  }
};

