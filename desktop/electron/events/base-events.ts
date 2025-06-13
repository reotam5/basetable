/* eslint-disable @typescript-eslint/no-unused-vars */
import { IpcMainEvent, IpcMainInvokeEvent } from 'electron';

export class BaseEvent {
  protected name: string;
  protected once = false;
  protected runned = false;
  protected invoke = false;

  constructor(name: string, once = false, invoke = false) {
    this.name = name;
    this.once = once;
    this.invoke = invoke;
  }

  public runOnce(): boolean {
    return this.once;
  }

  public useInvoke(): boolean {
    return this.invoke;
  }

  public getName(): string {
    return this.name;
  }

  public async preExecute(receivedEvent: IpcMainEvent | IpcMainInvokeEvent, ...args: any[]): Promise<any> {
    if (this.runned && this.once) return;
    this.runned = true;
    return this.execute(receivedEvent, ...args);
  }

  protected async execute(receivedEvent: IpcMainEvent | IpcMainInvokeEvent, ...args: any[]): Promise<any> {
    throw new Error(`The run method has not been implemented for event ${this.name}`);
  }
}
