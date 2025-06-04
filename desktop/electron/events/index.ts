import { AuthAccessToken, AuthLogin, AuthLogout, AuthOpen, AuthProfile } from './AuthEvents.js';
import { DatabaseExportApplicationSettings, DatabaseGetEncryption, DatabaseImport, DatabaseResetApplicationSettings } from './DatabaseEvents.js';
import { WindowResizeOnboarding } from './WindowResizeOnboarding.js';

export const events = [
  AuthAccessToken,
  AuthLogin,
  AuthLogout,
  AuthOpen,
  AuthProfile,

  WindowResizeOnboarding,

  DatabaseGetEncryption,
  DatabaseExportApplicationSettings,
  DatabaseImport,
  DatabaseResetApplicationSettings,
]