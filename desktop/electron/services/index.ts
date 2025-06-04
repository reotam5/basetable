import { AgentService } from "./AgentService.js";
import { APIKeyService } from "./APIKeyService.js";
import { ChatService } from "./ChatService.js";
import { LLMService } from "./LLMService.js";
import { MCPService } from "./MCPService.js";
import { SettingService } from "./SettingService.js";
import { StyleService } from "./StyleService.js";
import { UserService } from "./UserService.js";

export const services = [
  AgentService,
  APIKeyService,
  ChatService,
  LLMService,
  MCPService,
  SettingService,
  StyleService,
  UserService,
]