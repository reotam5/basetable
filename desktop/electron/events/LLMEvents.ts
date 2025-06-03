import { Backend } from "../backend.js";
import { LLMService } from "../db/services/LLM.js";
import { BaseEvent } from "./BaseEvent.js";

export class LLMGetAll extends BaseEvent {
  constructor(backend: Backend) {
    super('llm.getAll', backend, false, true);
  }

  override async execute(): Promise<any> {
    return await LLMService.getLLMs();
  }
}