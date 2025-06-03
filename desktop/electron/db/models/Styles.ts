import { DataTypes, Model, ModelAttributes, ModelCtor, ModelOptions, Sequelize } from "sequelize";

export const Styles: {
  name: string;
  options: ModelOptions<Model<any, any>>;
  attributes: ModelAttributes<Model<any, any>>;

  // meant for customizing models such as adding associations. This is called after all models are defined, before syncing.
  customize?: (sequelize: Sequelize) => Promise<void>;

  // meant for adding default entries to the model after logged in. This happens after every login. By using ignoreDuplicates, it will not create duplicates if the entries already exist.
  addDefaultEntries?: (model: ModelCtor<Model>, userId: string) => Promise<void>;
} = {
  name: "Styles",
  options: {
    timestamps: true,
  },
  attributes: {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['tone', 'style']],
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    }
  },
  customize: async (sequelize: Sequelize) => {
    // Styles(many) - Agents(many)
    const Agents = sequelize.model('Agents');
    const Agents_Styles = sequelize.model('Agents_Styles');
    const Styles = sequelize.model('Styles');
    Styles.belongsToMany(Agents, { through: Agents_Styles, foreignKey: 'styleId' });
  },
  addDefaultEntries: async (model) => {
    await model.bulkCreate([
      { id: 1, type: 'tone', name: 'Friendly', description: 'A friendly and approachable tone.' },
      { id: 2, type: 'tone', name: 'Professional', description: 'A formal and professional tone.' },
      { id: 3, type: 'tone', name: 'Casual', description: 'A relaxed and informal tone.' },
      { id: 4, type: 'tone', name: 'Technical', description: 'A precise and technical tone.' },
      { id: 5, type: 'tone', name: 'Creative', description: 'An imaginative and artistic tone.' },
      { id: 6, type: 'tone', name: 'Concise', description: 'A brief and to-the-point tone.' },
      { id: 7, type: 'style', name: 'Detailed', description: 'A comprehensive and thorough style.' },
      { id: 8, type: 'style', name: 'Bullet Points', description: 'A concise style using bullet points.' },
      { id: 9, type: 'style', name: 'Step by Step', description: 'A sequential and instructional style.' },
      { id: 10, type: 'style', name: 'Conversational', description: 'An informal and engaging style.' },
      { id: 11, type: 'style', name: 'Analytical', description: 'A logical and data-driven style.' },
      { id: 12, type: 'style', name: 'Storytelling', description: 'A narrative and engaging style.' },
    ], {
      ignoreDuplicates: true, // Prevents duplicates if the entries already exist
    })
  }
};
