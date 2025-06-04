import { InferAttributes, InferCreationAttributes } from 'sequelize';
import { BelongsToMany, Column, DataType, Model, Table } from 'sequelize-typescript';
import User_MCP from './user-mcp.model.js';
import User from './user.model.js';

@Table({
  timestamps: true,
})
export default class MCP extends Model<InferAttributes<MCP>, InferCreationAttributes<MCP>> {

  @Column({
    primaryKey: true,
    type: DataType.INTEGER,
    autoIncrement: true,
    allowNull: false,
  })
  id?: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
    comment: "Name of the MCP server",
  })
  name!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: "Description of the MCP server",
  })
  description?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  icon?: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    comment: "array of string representing tools available on the MCP server",
  })
  tools?: string[];

  @BelongsToMany(() => User, () => User_MCP)
  users?: Array<User & { User_MCP: User_MCP }>;
}
