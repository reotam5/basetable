import { InferAttributes, InferCreationAttributes } from 'sequelize';
import { Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import User_MCP from './user-mcp.model.js';
import User from './user.model.js';

@Table({
  timestamps: true,
})
export default class ApiKey extends Model<InferAttributes<ApiKey>, InferCreationAttributes<ApiKey>> {

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
  })
  name!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  value!: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  lastUsed?: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  userId?: string;

  @ForeignKey(() => User_MCP)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userMcpId!: number;
}
