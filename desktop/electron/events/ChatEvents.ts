import { IpcMainInvokeEvent } from "electron";
import { Backend } from "../backend.js";
import { ChatService } from "../db/services/Chat.js";
import { BaseEvent } from "./BaseEvent.js";

export class ChatCreate extends BaseEvent {
  constructor(backend: Backend) {
    super('chat.create', backend, false, true);
  }

  override async execute(_: IpcMainInvokeEvent, arg: Parameters<typeof ChatService.createChat>[0]): Promise<any> {
    return await ChatService.createChat(arg)
  }
}

export class ChatGetAll extends BaseEvent {
  constructor(backend: Backend) {
    super('chat.getAll', backend, false, true);
  }

  override async execute(_: IpcMainInvokeEvent, arg: Parameters<typeof ChatService.getChats>[0]): Promise<any> {
    return await ChatService.getChats(arg)
  }
}

export class ChatGetById extends BaseEvent {
  constructor(backend: Backend) {
    super('chat.getById', backend, false, true);
  }

  override async execute(_: IpcMainInvokeEvent, arg: Parameters<typeof ChatService.getChatById>[0]): Promise<any> {
    return await ChatService.getChatById(arg)
  }
}

export class ChatUpdate extends BaseEvent {
  constructor(backend: Backend) {
    super('chat.update', backend, false, true);
  }

  override async execute(_: IpcMainInvokeEvent, args: Parameters<typeof ChatService.updateChat>): Promise<any> {
    return await ChatService.updateChat(...args)
  }
}

export class ChatDelete extends BaseEvent {
  constructor(backend: Backend) {
    super('chat.delete', backend, false, true);
  }

  override async execute(_: IpcMainInvokeEvent, id: Parameters<typeof ChatService.deleteChat>[0]): Promise<any> {
    return await ChatService.deleteChat(id)
  }
}

export class ChatSearch extends BaseEvent {
  constructor(backend: Backend) {
    super('chat.search', backend, false, true);
  }

  override async execute(_: IpcMainInvokeEvent, search: Parameters<typeof ChatService.searchChats>[0], options?: Parameters<typeof ChatService.searchChats>[1]): Promise<any> {
    return await ChatService.searchChats(search, options)
  }
}

export class MessageCreate extends BaseEvent {
  constructor(backend: Backend) {
    super('message.create', backend, false, true);
  }

  override async execute(_: IpcMainInvokeEvent, data: Parameters<typeof ChatService.createMessage>[0]): Promise<any> {
    return await ChatService.createMessage(data)
  }
}

export class MessageGetByChat extends BaseEvent {
  constructor(backend: Backend) {
    super('message.getByChat', backend, false, true);
  }

  override async execute(_: IpcMainInvokeEvent, id: number, options?: Parameters<typeof ChatService.getMessagesByChat>[1]): Promise<any> {
    return await ChatService.getMessagesByChat(id, options)
  }
}

export class AttachmentCreate extends BaseEvent {
  constructor(backend: Backend) {
    super('attachment.create', backend, false, true);
  }

  override async execute(_: IpcMainInvokeEvent, args: Parameters<typeof ChatService.createAttachment>): Promise<any> {
    return await ChatService.createAttachment(...args)
  }
}

export class AttachmentgetByMessage extends BaseEvent {
  constructor(backend: Backend) {
    super('attachment.getByMessage', backend, false, true);
  }

  override async execute(_: IpcMainInvokeEvent, args: Parameters<typeof ChatService.getAttachmentsByMessage>): Promise<any> {
    return await ChatService.getAttachmentsByMessage(...args)
  }
}
