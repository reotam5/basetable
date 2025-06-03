import { DataTypes, QueryInterface, Sequelize } from "sequelize";

export interface Migration {
  id: string;
  name: string;
  up: (queryInterface: QueryInterface, sequelize: Sequelize) => Promise<void>;
  down: (queryInterface: QueryInterface, sequelize: Sequelize) => Promise<void>;
}

export abstract class BaseMigration implements Migration {
  abstract id: string;
  abstract name: string;
  abstract up(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void>;
  abstract down(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void>;
}

// Migration tracking table definition
export const MigrationModel = {
  name: "Migrations",
  attributes: {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    executedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  options: {
    timestamps: false,
    tableName: "migrations",
  },
};
