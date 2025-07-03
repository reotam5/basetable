import { eq } from "drizzle-orm";
import { database } from "../database/database.js";
import { agent } from "../database/tables/agent.js";
import { llm } from "../database/tables/llm.js";
import { api } from "../helpers/axios-api.js";
import { Logger } from "../helpers/custom-logger.js";
import { event, service } from "../helpers/decorators.js";
import { AgentService } from "./agent-service.js";

@service
class LibraryService {

  @event('library.create', 'handle')
  async createLibraryEntry(input: Awaited<ReturnType<typeof AgentService.getAllAgentsWithTools>>[number]) {
    const [llm_model] = await database()
      .select()
      .from(llm)
      .where(eq(llm.id, input.llm_id))

    const data = {
      name: input.name,
      model: llm_model.model,
      comm_preferences: {
        tone: input.tones?.[0]?.style_key ?? null,
        style: input.styles?.[0]?.style_key ?? null,
      },
      system_prompt: input.instruction,
      mcp: input.mcps?.map(mcp => ({
        command: mcp.serverConfig?.command,
        arguments: mcp.serverConfig?.args,
        env: mcp.serverConfig?.env,
      }))
    }
    const result = await api.post('/v1/library/agents', data);
    Logger.info(result.data)

    // update agent uploaded_id
    await database()
      .update(agent)
      .set({ uploaded_id: result.data.agent_id, uploaded_status: 'uploaded' })
      .where(eq(agent.id, input.id));
  }
}

const instance = new LibraryService();
export { instance as LibraryService };
