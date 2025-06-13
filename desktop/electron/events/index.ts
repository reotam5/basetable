import { AuthAccessToken, AuthLogin, AuthLogout, AuthOpen, AuthProfile } from './auth-events.js';
import { DatabaseGetEncryption } from './database-events.js';
import { PaymentPurchase } from './payment-events.js';
import { WindowResizeOnboarding } from './window-events.js';

export const events = [
  AuthAccessToken,
  AuthLogin,
  AuthLogout,
  AuthOpen,
  AuthProfile,

  WindowResizeOnboarding,

  DatabaseGetEncryption,

  PaymentPurchase,
]