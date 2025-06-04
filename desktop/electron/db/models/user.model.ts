import { InferAttributes, InferCreationAttributes } from 'sequelize';
import { BelongsToMany, Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import Agent from './agent.model.js';
import ApiKey from './api-key.model.js';
import Chat from './chat.model.js';
import MCP from './mcp.model.js';
import Setting from './settings.model.js';
import User_MCP from './user-mcp.model.js';

@Table({
  timestamps: true,
})
export default class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {

  @Column({
    primaryKey: true,
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  id?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  name?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  email?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  picture?: string;

  @HasMany(() => ApiKey)
  apiKeys?: ApiKey[];

  @HasMany(() => Agent)
  agents?: Agent[];

  @BelongsToMany(() => MCP, () => User_MCP)
  mcps?: Array<MCP & { User_MCP: User_MCP }>;

  @HasMany(() => Setting)
  settings?: Setting[];

  @HasMany(() => Chat)
  Chats?: Chat[];
}