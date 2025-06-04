import { InferAttributes, InferCreationAttributes } from "sequelize";
import { BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table } from "sequelize-typescript";
import ApiKey from "./api-key.model.js";
import MCP from "./mcp.model.js";
import User from "./user.model.js";

@Table({
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ["userId", "mcpId"],
    }
  ],
})
export default class User_MCP extends Model<InferAttributes<User_MCP>, InferCreationAttributes<User_MCP>> {
  @Column({
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  id?: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  is_active!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  is_installed!: boolean;

  @ForeignKey(() => User)
  @Column
  userId!: string;

  @ForeignKey(() => MCP)
  @Column
  mcpId!: number;

  @BelongsTo(() => MCP)
  mcp?: MCP;

  @HasMany(() => ApiKey)
  apiKeys?: ApiKey[];
}