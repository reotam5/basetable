import { InferAttributes, InferCreationAttributes } from "sequelize";
import { Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import User from "./user.model.js";

@Table({
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ["key", "userId"],
    }
  ]
})
export default class Setting extends Model<InferAttributes<Setting>, InferCreationAttributes<Setting>> {

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
  key!: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  value?: any;

  @Column({
    type: DataType.ENUM("date", "array", "object", "boolean", "null", "undefined", "bigint", "number", "string"),
    allowNull: false,
    defaultValue: "string",
  })
  type!: "date" | "array" | "object" | "boolean" | "null" | "undefined" | "bigint" | "number" | "string";

  @ForeignKey(() => User)
  @Column
  userId?: string;
}