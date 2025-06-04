import { InferAttributes, InferCreationAttributes } from "sequelize";
import { BelongsToMany, Column, DataType, Model, Table } from "sequelize-typescript";
import Agent_Style from "./agent-style.model.js";
import Agent from "./agent.model.js";

@Table({
  timestamps: true,
})
export default class Style extends Model<InferAttributes<Style>, InferCreationAttributes<Style>> {

  @Column({
    primaryKey: true,
    type: DataType.INTEGER,
    autoIncrement: true,
    allowNull: false,
  })
  id?: number;

  @Column({
    type: DataType.ENUM("tone", "style")
  })
  type!: "tone" | "style";

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  description?: string;

  @BelongsToMany(() => Agent, () => Agent_Style)
  agents?: Agent[];

}