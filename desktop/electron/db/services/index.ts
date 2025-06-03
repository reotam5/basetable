import { AgentService } from "./Agent.js";
import { APIKeyService } from "./APIKey.js";
import { ChatService } from "./Chat.js";
import { LLMService } from "./LLM.js";
import { MCPService } from "./MCP.js";
import { SettingService } from "./Setting.js";
import { StyleService } from "./Style.js";
import { UserService } from "./User.js";

export const services = [
  UserService,
  SettingService,
  MCPService,
  APIKeyService,
  AgentService,
  LLMService,
  StyleService,
  ChatService,
]