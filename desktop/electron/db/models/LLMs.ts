import { DataTypes, Model, ModelAttributes, ModelCtor, ModelOptions, Sequelize } from "sequelize";

export const LLMs: {
  name: string;
  options: ModelOptions<Model<any, any>>;
  attributes: ModelAttributes<Model<any, any>>;

  // meant for customizing models such as adding associations. This is called after all models are defined, before syncing.
  customize?: (sequelize: Sequelize) => Promise<void>;

  // meant for adding default entries to the model after logged in. This happens after every login. By using ignoreDuplicates, it will not create duplicates if the entries already exist.
  addDefaultEntries?: (model: ModelCtor<Model>, userId: string) => Promise<void>;
} = {
  name: "LLMs",
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
    },
    provider: {
      type: DataTypes.ENUM('OpenAI', 'Anthropic', 'Google', 'Azure', 'Other'),
      allowNull: false,
      comment: "The provider/company of the LLM (e.g., OpenAI, Anthropic, Google)",
    },
  },
  addDefaultEntries: async (model) => {
    await model.bulkCreate([
      { id: 1, name: "GPT-4", provider: "OpenAI" },
      { id: 2, name: "GPT-3.5 Turbo", provider: "OpenAI" },
      { id: 3, name: "Gemini Pro", provider: "Google" },
      { id: 4, name: "Claude 3 Opus", provider: "Anthropic" },
      { id: 5, name: "Claude 3 Sonnet", provider: "Anthropic" },
    ], {
      ignoreDuplicates: true,
    })
  }
};
