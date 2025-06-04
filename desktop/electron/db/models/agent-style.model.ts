import { InferAttributes, InferCreationAttributes } from "sequelize";
import { Column, ForeignKey, Model, Table } from "sequelize-typescript";
import Agent from "./agent.model.js";
import Style from "./style.model.js";

@Table({
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ["agentId", "styleId"],
    }
  ],
})
export default class Agent_Style extends Model<InferAttributes<Agent_Style>, InferCreationAttributes<Agent_Style>> {
  @ForeignKey(() => Agent)
  @Column
  agentId!: number;

  @ForeignKey(() => Style)
  @Column
  styleId!: number;
}