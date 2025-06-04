import { InferAttributes, InferCreationAttributes } from "sequelize";
import { Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import Agent from "./agent.model.js";
import User_MCP from "./user-mcp.model.js";

@Table({
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ["agentId", "userMcpId"],
    }
  ],
})
export default class Agent_User_MCP extends Model<InferAttributes<Agent_User_MCP>, InferCreationAttributes<Agent_User_MCP>> {
  @ForeignKey(() => Agent)
  @Column
  agentId!: number;

  @ForeignKey(() => User_MCP)
  @Column
  userMcpId!: number;

  @Column({
    type: DataType.JSON,
    allowNull: true,
    comment: "Array of selected tool names for this MCP server",
  })
  selected_tools?: string[];
}