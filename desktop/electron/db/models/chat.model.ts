import { InferAttributes, InferCreationAttributes } from "sequelize";
import { Column, DataType, ForeignKey, HasMany, Model, Table } from "sequelize-typescript";
import Message from "./message.model.js";
import User from "./user.model.js";

@Table({
  timestamps: true,
})
export default class Chat extends Model<InferAttributes<Chat>, InferCreationAttributes<Chat>> {

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
    defaultValue: "New Chat"
  })
  title!: string;

  @ForeignKey(() => User)
  @Column
  userId!: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  lastMessageAt?: Date;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  metadata?: Record<string, any>;

  @HasMany(() => Message)
  messages?: Message[];
}