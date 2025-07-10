import { and, eq } from "drizzle-orm";
import path, { join } from "path";
import { fileURLToPath } from "url";
import { AuthHandler } from "../helpers/auth-handler.js";
import { database } from "./database.js";
import { agent, agent_style, api_key, llm, setting } from "./tables/index.js";
import { mcp_server } from "./tables/mcp-server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedDatabase() {
  await seedDefaultSettings();

  // create mcp servers
  const mcpServers: typeof mcp_server.$inferInsert[] = [
    {
      type: "preset",
      user_id: AuthHandler.profile!.sub,
      name: "Google Calendar",
      icon: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Google_Calendar_icon_%282020-2021%29.png",
      available_tools: [],
      description: "A time management and scheduling service developed by Google.",
      server_config: {
        command: "npx",
        args: ["@cocal/google-calendar-mcp"],
        env: {
          "GOOGLE_OAUTH_CREDENTIALS": join(__dirname, "credentials", "google.json")
        }
      }
    },

    {
      type: "preset",
      user_id: AuthHandler.profile!.sub,
      name: "Sequential Thinking",
      icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Sequential_Thinking_Icon.svg/1200px-Sequential_Thinking_Icon.svg.png",
      available_tools: [],
      description: "A tool for breaking down complex problems into manageable steps.",
      server_config: {
        command: "npx",
        args: [
          "-y",
          "@modelcontextprotocol/server-sequential-thinking"
        ],
        env: {}
      }
    },

    // linear 
    {
      type: "preset",
      user_id: AuthHandler.profile!.sub,
      name: "Linear",
      icon: "https://linear.app/favicon-32x32.png",
      available_tools: [],
      description: "A modern issue tracking and project management tool.",
      server_config: {
        command: "npx",
        args: [
          "-y",
          "mcp-remote",
          "https://mcp.linear.app/sse"
        ],
        env: {
          "LINEAR_API_KEY": join(__dirname, "credentials", "linear.json")
        }
      }
    },

    // calculator
    {
      type: "preset",
      user_id: AuthHandler.profile!.sub,
      name: "Calculator",
      icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Calculator_icon_%282020%29.svg/1200px-Calculator_icon_%282020%29.svg.png",
      available_tools: [],
      description: "A simple calculator tool",
      server_config: {
        command: "uvx",
        args: [
          "mcp-server-calculator"
        ],
        env: {}
      }
    },

    // terminal
    {
      type: "preset",
      user_id: AuthHandler.profile!.sub,
      name: "Terminal",
      icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Terminal_icon_%282020%29.svg/1200px-Terminal_icon_%282020%29.svg.png",
      available_tools: [],
      description: "A tool for executing terminal commands.",
      server_config: {
        command: "npx",
        args: [
          "mcp-server-commands"
        ],
        env: {}
      }
    }
  ]
  await Promise.all(mcpServers.map(server => {
    const func = async () => {
      // check if the server already exists
      const [existingServer] = await database()
        .select()
        .from(mcp_server)
        .where(and(
          eq(mcp_server.user_id, server.user_id),
          eq(mcp_server.name, server.name),
          eq(mcp_server.type, server.type)
        ));

      // if it exists, update it
      if (existingServer) {
        await database()
          .update(mcp_server)
          .set(server)
          .where(eq(mcp_server.id, existingServer.id));
      } else {
        // if it doesn't exist, insert it
        await database()
          .insert(mcp_server)
          .values(server)
          .onConflictDoNothing();
      }


      const [update_mcp_server] = await database()
        .select()
        .from(mcp_server)
        .where(and(
          eq(mcp_server.user_id, server.user_id),
          eq(mcp_server.name, server.name),
          eq(mcp_server.type, server.type)
        ))

      // create dummy API keys for the user
      await database()
        .insert(api_key)
        .values([
          { name: `Dummy Key for ${server.name}-1`, mcp_server_id: update_mcp_server.id!, value: `dummy-key-${server.id}-${AuthHandler.profile!.sub}-1`, user_id: AuthHandler.profile!.sub },
          { name: `Dummy Key for ${server.name}-2`, mcp_server_id: update_mcp_server.id!, value: `dummy-key-${server.id}-${AuthHandler.profile!.sub}-2`, user_id: AuthHandler.profile!.sub }
        ])
        .onConflictDoNothing();
    }
    return func();
  }))


  // agent styles
  const styles: typeof agent_style.$inferInsert[] = [
    { id: 1, type: 'tone', style_key: 'friendly', name: 'Friendly', description: 'A friendly and approachable tone.' },
    { id: 2, type: 'tone', style_key: 'professional', name: 'Professional', description: 'A formal and professional tone.' },
    { id: 3, type: 'tone', style_key: 'casual', name: 'Casual', description: 'A relaxed and informal tone.' },
    { id: 4, type: 'tone', style_key: 'technical', name: 'Technical', description: 'A precise and technical tone.' },
    { id: 5, type: 'tone', style_key: 'creative', name: 'Creative', description: 'An imaginative and artistic tone.' },
    { id: 6, type: 'tone', style_key: 'concise', name: 'Concise', description: 'A brief and to-the-point tone.' },
    { id: 7, type: 'style', style_key: 'detailed', name: 'Detailed', description: 'A comprehensive and thorough style.' },
    { id: 8, type: 'style', style_key: 'bulletpoints', name: 'Bullet Points', description: 'A concise style using bullet points.' },
    { id: 9, type: 'style', style_key: 'stepbystep', name: 'Step by Step', description: 'A sequential and instructional style.' },
    { id: 10, type: 'style', style_key: 'conversational', name: 'Conversational', description: 'An informal and engaging style.' },
    { id: 11, type: 'style', style_key: 'analytical', name: 'Analytical', description: 'A logical and data-driven style.' },
    { id: 12, type: 'style', style_key: 'storytelling', name: 'Storytelling', description: 'A narrative and engaging style.' }
  ]
  await Promise.all(styles.map(style => (
    database()
      .insert(agent_style)
      .values(style)
      .onConflictDoUpdate({
        target: agent_style.id,
        set: {
          type: style.type,
          name: style.name,
          description: style.description,
          style_key: style.style_key,
        }
      })
  )))

  // local llm
  const llms: typeof llm.$inferInsert[] = [
    { id: 1, display_name: "Mistral Nemo", description: "A powerful, open-source model for complex tasks", provider: "Mistral AI", model: 'mistral-nemo', model_path: 'mistral-nemo.gguf', is_default: false, download_url: 'hf:mradermacher/Mistral-Nemo-Instruct-2407-GGUF:Q4_K_M' },

    // deepseek-5Gb
    { id: 2, display_name: "DeepSeek", config: { temperature: 0, topP: 0.9, repeatPenalty: { penalty: 1.1 } }, description: "A compact model for quick tasks", provider: "DeepSeek AI", model: 'deepseek-5gb', model_path: 'deepseek-5gb.gguf', is_default: true, download_url: 'hf:unsloth/DeepSeek-R1-0528-Qwen3-8B-GGUF:Q4_K_M' },
  ]
  await Promise.all(llms.map(llmData => (
    database()
      .insert(llm)
      .values(llmData)
      .onConflictDoUpdate({
        target: llm.id,
        set: {
          display_name: llmData.display_name,
          description: llmData.description,
          provider: llmData.provider,
          model: llmData.model,
          download_url: llmData.download_url,
          model_path: llmData.model_path,
          config: llmData.config || {},
        }
      })
  )))


  // create main agent for this user if it doesn't exist
  const mainAgent = await database()
    .select()
    .from(agent)
    .where(and(eq(agent.user_id, AuthHandler.profile!.sub), eq(agent.is_main, true)))
  if (!mainAgent?.length) {
    await database()
      .insert(agent)
      .values({
        name: "Main Agent",
        instruction: "You are the main agent responsible for managing user interactions and tasks. Use the available tools to assist the user effectively.",
        is_main: true,
        user_id: AuthHandler.profile!.sub,
        llm_id: (await database().select().from(llm).where(eq(llm.is_default, true)))?.[0]?.id || 1,
      });
  }
}

export async function seedDefaultSettings() {
  const settings: typeof setting.$inferInsert[] = [
    { key: "appearance.theme", value: "light", type: "string", user_id: AuthHandler.profile!.sub },
    { key: "appearance.font", value: "default", type: "string", user_id: AuthHandler.profile!.sub },
    { key: "account.notifications.category.mcpServerStatus", value: "true", type: "boolean", user_id: AuthHandler.profile!.sub },
    { key: "account.notifications.category.costAlert", value: "true", type: "boolean", user_id: AuthHandler.profile!.sub },
    { key: "account.notifications.category.weeklyReports", value: "true", type: "boolean", user_id: AuthHandler.profile!.sub },
    { key: "account.notifications.delivery.email", value: "true", type: "boolean", user_id: AuthHandler.profile!.sub },
    { key: "account.notifications.delivery.inApp", value: "true", type: "boolean", user_id: AuthHandler.profile!.sub },
    { key: "security.autoKeyRotation", value: "true", type: "boolean", user_id: AuthHandler.profile!.sub },
    { key: "agent.autoRoute", value: "false", type: "boolean", user_id: AuthHandler.profile!.sub },
  ]
  await Promise.all(settings.map(settingData => (
    database()
      .insert(setting)
      .values(settingData)
      .onConflictDoNothing()
  )));
}