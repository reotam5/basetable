import { DataTypes, Model, ModelAttributes, ModelCtor, ModelOptions, Sequelize } from "sequelize";

export const Settings: {
  name: string;
  options: ModelOptions<Model<any, any>>;
  attributes: ModelAttributes<Model<any, any>>;

  // meant for customizing models such as adding associations. This is called after all models are defined, before syncing.
  customize?: (sequelize: Sequelize) => Promise<void>;

  // meant for adding default entries to the model after logged in. This happens after every login. By using ignoreDuplicates, it will not create duplicates if the entries already exist.
  addDefaultEntries?: (model: ModelCtor<Model>, userId: string) => Promise<void>;
} = {
  name: "Settings",
  options: {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["userId", "key"],
      },
    ],
  },
  attributes: {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    value: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'string',
      comment: 'Type of the value: string, array, object, number, boolean, etc.'
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
    },
  },
  addDefaultEntries: async (model, userId) => {
    await model.bulkCreate([
      { key: "appearance.theme", value: "light", type: "string", userId: userId },
      { key: "appearance.font", value: "font-sans", type: "string", userId: userId },
      { key: "account.notifications.category.mcpServerStatus", value: true, type: "boolean", userId: userId },
      { key: "account.notifications.category.costAlert", value: true, type: "boolean", userId: userId },
      { key: "account.notifications.category.weeklyReports", value: true, type: "boolean", userId: userId },
      { key: "account.notifications.delivery.email", value: true, type: "boolean", userId: userId },
      { key: "account.notifications.delivery.inApp", value: true, type: "boolean", userId: userId },
      { key: "security.autoKeyRotation", value: true, type: "boolean", userId: userId },
      { key: "billing.budget", value: 0, type: "number", userId: userId },
    ], {
      ignoreDuplicates: true,
    });
  },
};
