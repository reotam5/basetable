import { shell } from "electron";
import { api } from "./API.js";
import { Logger } from "./Logger.js";
import { Window } from "./Window.js";

class PaymentHandler {
  static #instance: PaymentHandler;
  static readonly PAYMENT_URL = `/api/v1/payments`;
  static readonly PAYMENT_CALLBACK_EVENT = "payment.callback";
  private static availableCredit: number = 0;

  private constructor() { }

  public static get instance(): PaymentHandler {
    if (!PaymentHandler.#instance) {
      PaymentHandler.#instance = new PaymentHandler();
    }

    return PaymentHandler.#instance;
  }

  private async refreshAvailableCredit(): Promise<void> {
    // Fetch the available credit from the server
    PaymentHandler.availableCredit = 10;
  }

  public async getAvailableCredit(): Promise<number> {
    await this.refreshAvailableCredit();
    return PaymentHandler.availableCredit;
  }

  public async purchase(amount: number): Promise<void> {
    const res = await api.post(PaymentHandler.PAYMENT_URL, {
      currency: 'usd',
      amount: amount * 100,
    })

    if (res.status !== 201) {
      Logger.error("Payment request failed", res.status, res.statusText);
      throw new Error(`Payment request failed: ${res.status} ${res.statusText}`);
    }

    if (!res.data || !res.data.session_url) {
      Logger.error("Payment error: No session URL in response", res.data);
      throw new Error("Payment error: No session URL in response");
    }

    await shell.openExternal(res.data.session_url)
  }

  public async handlePaymentSuccess(window: Window, url: string): Promise<void> {
    const sessionId = new URL(url).searchParams.get("session_id");
    Logger.info("Payment successful for session:", sessionId);
    this.refreshAvailableCredit();
    window.windowInstance.webContents.send(PaymentHandler.PAYMENT_CALLBACK_EVENT, {
      sessionId: sessionId,
      credits: PaymentHandler.availableCredit,
      success: true,
    });
  }

  public async handlePaymentCancel(window: Window, url: string): Promise<void> {
    const sessionId = new URL(url).searchParams.get("session_id");
    Logger.info("Payment cancelled for session:", sessionId);
    this.refreshAvailableCredit();
    window.windowInstance.webContents.send(PaymentHandler.PAYMENT_CALLBACK_EVENT, {
      sessionId: sessionId,
      credits: PaymentHandler.availableCredit,
      success: false,
    });
  }
}

const instance = PaymentHandler.instance;

export { instance as PaymentHandler };

