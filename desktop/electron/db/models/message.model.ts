import { InferAttributes, InferCreationAttributes } from "sequelize";
import { Column, DataType, ForeignKey, HasMany, Model, Table } from "sequelize-typescript";
import Attachment from "./attachment.model.js";
import Chat from "./chat.model.js";

@Table({
  timestamps: true,
})
export default class Message extends Model<InferAttributes<Message>, InferCreationAttributes<Message>> {

  @Column({
    primaryKey: true,
    type: DataType.INTEGER,
    autoIncrement: true,
    allowNull: false,
  })
  id?: number;

  @Column({
    type: DataType.ENUM("user", "assistant", "system"),
    allowNull: false,
  })
  type!: "user" | "assistant" | "system";

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  content!: string;

  @Column({
    type: DataType.ENUM("pending", "success", "error", "cancelled"),
    allowNull: false,
    defaultValue: "success",
  })
  status!: "pending" | "success" | "error" | "cancelled";

  @ForeignKey(() => Chat)
  @Column
  chatId!: number;

  @HasMany(() => Attachment)
  attachments?: Attachment[];
}