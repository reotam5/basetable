import { eq } from "drizzle-orm";
import { database } from "../database/database.js";
import { agent_style } from "../database/tables/agent-style.js";
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

    // update agent uploaded_id
    await database()
      .update(agent)
      .set({ uploaded_id: result.data.agent_id, uploaded_status: 'uploaded' })
      .where(eq(agent.id, input.id));
  }

  @event('library.getAll', 'handle')
  async getAllLibraryEntries() {
    try {
      const response = await api.get('/v1/library/agents');
      const llms = await database()
        .select()
        .from(llm)

      const styles = await database()
        .select()
        .from(agent_style)


      return response.data.agents?.map((
        agent: {
          "id": string,
          "name": string,
          "model": string,
          "mcp":
          {
            "command": string,
            "arguments": string[],
            "env": Record<string, string>
          }[],
          "system_prompt": string,
          "comm_preferences": {
            "tone": string,
            "style": string
          }
        }
      ) => ({
        ...agent,
        model: llms.find(llm => llm.model === agent.model),
        comm_preferences: {
          tone: styles.find(style => style.style_key === agent.comm_preferences?.tone),
          style: styles.find(style => style.style_key === agent.comm_preferences?.style),
        }
      })) as {
        id: string;
        name: string;
        model: typeof llm.$inferSelect;
        mcp: {
          command: string;
          arguments: string[];
          env: Record<string, string>;
        }[];
        system_prompt: string;
        comm_preferences: {
          tone: typeof agent_style.$inferSelect | null;
          style: typeof agent_style.$inferSelect | null;
        };
      }[];
    } catch (error) {
      Logger.error('Error fetching library entries:', error);
      throw error;
    }
  }
}

const instance = new LibraryService();
export { instance as LibraryService };
