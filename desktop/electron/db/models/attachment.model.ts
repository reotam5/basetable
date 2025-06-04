import { InferAttributes, InferCreationAttributes } from "sequelize";
import { Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import Message from "./message.model.js";

@Table({
  timestamps: true,
})
export default class Attachment extends Model<InferAttributes<Attachment>, InferCreationAttributes<Attachment>> {

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
  filename!: string;

  @Column({
    type: DataType.ENUM("image", "audio", "video", "document", "other"),
    allowNull: false,
  })
  type!: "image" | "audio" | "video" | "document" | "other";

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  filePath!: string;

  @ForeignKey(() => Message)
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  messageId!: string;
}