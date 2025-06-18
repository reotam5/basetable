import { shell } from "electron";
import { api } from "./axios-api.js";
import { Logger } from "./custom-logger.js";
import { Window } from "./custom-window.js";

class PaymentHandler {
  static #instance: PaymentHandler;
  static readonly PAYMENT_URL = `/v1/payments`;
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
    try {
      const res = await api.get('/v1/account');
      if (res.status !== 200) {
        Logger.error("Failed to fetch account balance", res.status, res.statusText);
        throw new Error(`Failed to fetch account balance: ${res.status} ${res.statusText}`);
      }

      if (!res.data) {
        Logger.error("Refresh available credit error: No balance in response", res.data);
        throw new Error("Invalid account balance response");
      }

      PaymentHandler.availableCredit = res.data.balance / 100;
    } catch (error) {
      Logger.error("Error refreshing available credit:", error);
    }
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
    await this.refreshAvailableCredit();
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

