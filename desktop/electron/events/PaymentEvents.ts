import { IpcMainInvokeEvent } from "electron";
import { Backend } from "../backend.js";
import { PaymentHandler } from "../helpers/PaymentHandler.js";
import { BaseEvent } from "./BaseEvent.js";

export class PaymentPurchase extends BaseEvent {

  constructor(backend: Backend) {
    super('payment.purchase', backend, false, true);
  }

  override async execute(_: IpcMainInvokeEvent, amount: number): Promise<any> {
    await PaymentHandler.purchase(amount)
  }
}