import { IpcMainInvokeEvent } from "electron";
import { PaymentHandler } from "../helpers/payment-handler.js";
import { BaseEvent } from "./base-events.js";

export class PaymentPurchase extends BaseEvent {

  constructor() {
    super('payment.purchase', false, true);
  }

  override async execute(_: IpcMainInvokeEvent, amount: number) {
    await PaymentHandler.purchase(amount)
  }
}