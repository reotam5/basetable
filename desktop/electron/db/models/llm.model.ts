import { InferAttributes, InferCreationAttributes } from "sequelize";
import { Column, DataType, HasMany, Model, Table } from "sequelize-typescript";
import Agent from "./agent.model.js";

@Table({
  timestamps: true,
})
export default class LLM extends Model<InferAttributes<LLM>, InferCreationAttributes<LLM>> {

  @Column({
    primaryKey: true,
    type: DataType.INTEGER,
    autoIncrement: true,
  })
  id?: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  name!: string;

  @Column({
    type: DataType.ENUM("OpenAI", "Anthropic", "Google", "Azure", "Other"),
    allowNull: false,
  })
  provider!: "OpenAI" | "Anthropic" | "Google" | "Azure" | "Other";

  @HasMany(() => Agent)
  agents?: Agent[];
}