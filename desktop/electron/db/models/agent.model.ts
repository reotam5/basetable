import { InferAttributes, InferCreationAttributes } from "sequelize";
import { BelongsTo, BelongsToMany, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import Agent_Style from "./agent-style.model.js";
import Agent_User_MCP from "./agent-user-mcp.model.js";
import LLM from "./llm.model.js";
import Style from "./style.model.js";
import User_MCP from "./user-mcp.model.js";
import User from "./user.model.js";

@Table({
  timestamps: true,
})
export default class Agent extends Model<InferAttributes<Agent>, InferCreationAttributes<Agent>> {

  @Column({
    primaryKey: true,
    type: DataType.INTEGER,
    autoIncrement: true,
    allowNull: false,
  })
  id?: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  name?: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  is_main!: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  instruction?: string;

  @ForeignKey(() => User)
  @Column
  userId!: string;

  @ForeignKey(() => LLM)
  @Column
  llmId!: number;

  @BelongsTo(() => LLM)
  llm?: LLM;

  @BelongsToMany(() => Style, () => Agent_Style)
  styles?: Style[];

  @BelongsToMany(() => User_MCP, () => Agent_User_MCP)
  userMcps?: Array<User_MCP & { Agent_User_MCP: Agent_User_MCP }>;
}
