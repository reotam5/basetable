import { AuthHandler } from "../helpers/AuthHandler.js";
import Agent from "./models/agent.model.js";
import ApiKey from "./models/api-key.model.js";
import LLM from "./models/llm.model.js";
import MCP from "./models/mcp.model.js";
import Setting from "./models/settings.model.js";
import Style from "./models/style.model.js";
import User_MCP from "./models/user-mcp.model.js";

export async function seedDatabase() {
  await seedDefaultSettings();

  // mcp servers
  await MCP.bulkCreate([
    { id: 1, name: "Gmail", description: "Access Gmail functionality including reading, sending, and managing emails.", tools: ["Send Email", "Read Email", "Search Email", "Manage Labels"], icon: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" },
    { id: 2, name: "Slack", description: "Integrate with Slack for messaging, and channel management.", tools: ["Send Message", "Read Messages", "Manage Channels", "Search Messages"], icon: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg" },
    { id: 3, name: "Github", description: "Connect to GitHub for repository management, issue tracking, and pull requests.", tools: ["Create Repository", "Manage Issues", "Review Pull Requests", "Search Repositories", "Code Search"], icon: "https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg" },
    { id: 4, name: "File System", description: "Interact with the local file system for file management tasks.", tools: ["Read File", "Write File", "Delete File", "List Directory", "Search Files"], icon: "https://upload.wikimedia.org/wikipedia/commons/f/f2/Folder-icon.svg" },
    { id: 5, name: "Notion", description: "Connect to Notion for managing notes, databases, and tasks.", tools: ["Create Page", "Read Page", "Update Page", "Search Pages", "Manage Databases"], icon: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png" },
    { id: 6, name: "Google Calendar", description: "Access Google Calendar for managing events and schedules.", tools: ["Create Event", "Read Events", "Update Event", "Delete Event", "Search Events"], icon: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" },
    { id: 7, name: "AWS Services", description: "Access various Amazon Web Services for cloud operations", tools: ['S3 Operations', 'Lambda Functions', 'EC2 Management', 'CloudWatch'], icon: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" },
    { id: 8, name: "PostgreSQL", description: "Connect to PostgreSQL databases for data management and queries.", tools: ["Execute Query", "Read Data", "Insert Data", "Update Data", "Delete Data"], icon: "https://upload.wikimedia.org/wikipedia/commons/2/29/Postgresql_elephant.svg" },
  ], { ignoreDuplicates: true });


  const mcpServers = await MCP.findAll({ attributes: ['id', 'name'] });
  for (const mcp of mcpServers) {
    // create user MCP associations if they don't exist
    const userMcp = await User_MCP.findOne({
      where: { userId: AuthHandler.profile!.sub, mcpId: mcp.id },
    });
    if (!userMcp) {
      const created = await User_MCP.create({
        is_active: false,
        is_installed: false,
        userId: AuthHandler.profile!.sub,
        mcpId: mcp.id!,
      });

      // DUMMY KEY FOR THIS USER_MCP
      await ApiKey.create({
        name: `Dummy Key for ${mcp.get('name')}-1`,
        userMcpId: created.id!,
        value: `dummy-key-${mcp.id}-${AuthHandler.profile!.sub}-1`,
        userId: AuthHandler.profile!.sub,
      })
      await ApiKey.create({
        name: `Dummy Key for ${mcp.get('name')}-2`,
        userMcpId: created.id!,
        value: `dummy-key-${mcp.id}-${AuthHandler.profile!.sub}-2`,
        userId: AuthHandler.profile!.sub,
      })
    }
  }

  // instruction styles
  await Style.bulkCreate([
    { id: 1, type: 'tone', name: 'Friendly', description: 'A friendly and approachable tone.' },
    { id: 2, type: 'tone', name: 'Professional', description: 'A formal and professional tone.' },
    { id: 3, type: 'tone', name: 'Casual', description: 'A relaxed and informal tone.' },
    { id: 4, type: 'tone', name: 'Technical', description: 'A precise and technical tone.' },
    { id: 5, type: 'tone', name: 'Creative', description: 'An imaginative and artistic tone.' },
    { id: 6, type: 'tone', name: 'Concise', description: 'A brief and to-the-point tone.' },
    { id: 7, type: 'style', name: 'Detailed', description: 'A comprehensive and thorough style.' },
    { id: 8, type: 'style', name: 'Bullet Points', description: 'A concise style using bullet points.' },
    { id: 9, type: 'style', name: 'Step by Step', description: 'A sequential and instructional style.' },
    { id: 10, type: 'style', name: 'Conversational', description: 'An informal and engaging style.' },
    { id: 11, type: 'style', name: 'Analytical', description: 'A logical and data-driven style.' },
    { id: 12, type: 'style', name: 'Storytelling', description: 'A narrative and engaging style.' },
  ], { ignoreDuplicates: true });


  // llm models
  await LLM.bulkCreate([
    { id: 1, name: "GPT-4", provider: "OpenAI" },
    { id: 2, name: "GPT-3.5 Turbo", provider: "OpenAI" },
    { id: 3, name: "Gemini Pro", provider: "Google" },
    { id: 4, name: "Claude 3 Opus", provider: "Anthropic" },
    { id: 5, name: "Claude 3 Sonnet", provider: "Anthropic" },
  ], { ignoreDuplicates: true });


  // create main agent for this user if it doesn't exist
  if (!(await Agent.findOne({ where: { userId: AuthHandler.profile?.sub, is_main: true } }))) {
    await Agent.create({
      name: "Main Agent",
      instruction: "You are the main agent responsible for managing user interactions and tasks. Use the available tools to assist the user effectively.",
      is_main: true,
      userId: AuthHandler.profile!.sub,
      llmId: 1,
    });
  }

  // loop through agents and ensure they have at least one style
  const agents = await Agent.findAll({ where: { userId: AuthHandler.profile?.sub } });
  for (const agent of agents) {
    const styles = await agent.$get('styles');
    if (styles.length === 0) {
      agent.$add('styles', (await Style.findAll({ where: { type: 'style' } }))[0]);
      agent.$add('styles', (await Style.findAll({ where: { type: 'tone' } }))[0]);
    }
  }
}

export async function seedDefaultSettings() {
  await Setting.bulkCreate([
    { key: "appearance.theme", value: "light", type: "string", userId: AuthHandler.profile?.sub },
    { key: "appearance.font", value: "default", type: "string", userId: AuthHandler.profile?.sub },
    { key: "account.notifications.category.mcpServerStatus", value: true, type: "boolean", userId: AuthHandler.profile?.sub },
    { key: "account.notifications.category.costAlert", value: true, type: "boolean", userId: AuthHandler.profile?.sub },
    { key: "account.notifications.category.weeklyReports", value: true, type: "boolean", userId: AuthHandler.profile?.sub },
    { key: "account.notifications.delivery.email", value: true, type: "boolean", userId: AuthHandler.profile?.sub },
    { key: "account.notifications.delivery.inApp", value: true, type: "boolean", userId: AuthHandler.profile?.sub },
    { key: "security.autoKeyRotation", value: true, type: "boolean", userId: AuthHandler.profile?.sub },
    { key: "billing.budget", value: 0, type: "number", userId: AuthHandler.profile?.sub },
  ], { ignoreDuplicates: true });
}