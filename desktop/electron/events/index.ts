import { AgentCreate, AgentDelete, AgentGet, AgentGetAll, AgentGetMain, AgentGetStyles, AgentGetTones, AgentUpdate } from './AgentEvents.js';
import { APIKeyDelete, APIKeySet } from './APIKeyEvents.js';
import { AuthAccessToken, AuthLogin, AuthLogout, AuthOpen, AuthProfile } from './AuthEvents.js';
import { AttachmentCreate, AttachmentgetByMessage, ChatCreate, ChatDelete, ChatGetAll, ChatGetById, ChatSearch, ChatUpdate, MessageCreate, MessageGetByChat } from './ChatEvents.js';
import { DatabaseExportApplicationSettings, DatabaseGetEncryption, DatabaseImport, DatabaseResetApplicationSettings } from './DatabaseEvents.js';
import { LLMGetAll } from './LLMEvents.js';
import { MCPGetAll, MCPInstall, MCPSetActiveState, MCPUninstall } from './MCPEvents.js';
import { SettingsGet, SettingsSet } from './SettingEvevnts.js';
import { WindowResizeOnboarding } from './WindowResizeOnboarding.js';

export const events = [
  AuthAccessToken,
  AuthLogin,
  AuthLogout,
  AuthOpen,
  AuthProfile,
  WindowResizeOnboarding,
  SettingsGet,
  SettingsSet,
  MCPGetAll,
  APIKeySet,
  APIKeyDelete,
  DatabaseGetEncryption,
  DatabaseExportApplicationSettings,
  DatabaseImport,
  DatabaseResetApplicationSettings,
  MCPInstall,
  MCPUninstall,
  MCPSetActiveState,
  AgentUpdate,
  AgentGet,
  LLMGetAll,
  AgentGetStyles,
  AgentGetTones,
  AgentGetAll,
  AgentCreate,
  AgentDelete,
  ChatCreate,
  ChatGetAll,
  ChatGetById,
  ChatUpdate,
  ChatDelete,
  ChatSearch,
  MessageCreate,
  MessageGetByChat,
  AttachmentCreate,
  AttachmentgetByMessage,
  AgentGetMain,
]