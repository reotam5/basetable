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
    { id: 1, name: "AWS Services", icon: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg", tools: ["S3 Storage", "Lambda Functions", "EC2 Instances", "DynamoDB", "CloudWatch", "IAM Management", "RDS Databases", "Elastic Beanstalk", "ECS Containers", "EKS Kubernetes", "API Gateway", "CloudFront CDN", "Route 53 DNS", "SQS Queues", "SNS Notifications", "CloudFormation", "Elastic Load Balancer", "Auto Scaling", "CloudTrail Logging", "AWS Config", "VPC Management", "Direct Connect", "AWS Backup", "AWS Shield", "WAF Security", "Cognito Authentication", "KMS Encryption", "Secrets Manager", "Systems Manager", "CloudWatch Events", "EventBridge", "Step Functions", "AppSync GraphQL", "Amplify Development", "CodeBuild", "CodePipeline", "CodeDeploy", "CodeCommit", "X-Ray Tracing", "CloudWatch Logs", "AWS Batch", "Elastic MapReduce", "Redshift Data Warehouse", "ElastiCache", "DocumentDB", "Neptune Graph DB", "Timestream", "OpenSearch", "Athena Query", "QuickSight Analytics", "SageMaker ML"], description: "A collection of AWS services for cloud computing.", },
    { id: 2, name: "GitHub", icon: "https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png", tools: ["Create Issues", "Update PRs", "Code Search", "Create Repository", "Clone Repository", "Manage Branches"], description: "A platform for version control and collaboration.", },
    { id: 3, name: "Slack", icon: "https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png", tools: ["Post Messages", "Create Channels", "Add Users", "Search History", "Set Status"], description: "A messaging app for teams to communicate and collaborate.", },
    { id: 4, name: "Google Drive", icon: "https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg", tools: ["Upload Files", "Create Documents", "Share Files", "Download Files", "Search Files", "Create Folders"], description: "A cloud storage service for file management and collaboration.", },
    { id: 5, name: "Microsoft 365", icon: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Microsoft_365_%282022%29.svg", tools: ["Edit Word Documents", "Create Excel Spreadsheets", "Manage Calendar", "Send Emails", "Schedule Meetings"], description: "A suite of productivity applications for business and personal use.", },
    { id: 6, name: "Jira", icon: "https://wac-cdn.atlassian.com/assets/img/favicons/atlassian/favicon.png", tools: ["Create Tickets", "Update Stories", "Manage Sprints", "Track Time", "Generate Reports"], description: "A project management tool for agile teams to plan and track work.", },
    { id: 7, name: "Salesforce", icon: "https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg", tools: ["Create Leads", "Update Contacts", "Manage Opportunities", "Generate Reports", "Schedule Tasks"], description: "A customer relationship management (CRM) platform for sales and marketing.", },
    { id: 8, name: "Stripe", icon: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg", tools: ["Process Payments", "Create Invoices", "Manage Subscriptions", "Handle Refunds", "Track Revenue"], description: "A payment processing platform for online businesses.", },
    { id: 9, name: "Asana", icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Asana_logo.svg/1200px-Asana_logo.svg.png", tools: ["Create Tasks", "Manage Projects", "Assign Work", "Set Deadlines", "Track Progress"], description: "A work management platform to help teams organize and track their work.", },
    { id: 10, name: "Airtable", icon: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Airtable_Logo.svg", tools: ["Create Tables", "Update Records", "Filter Data", "Export Data", "Connect Bases"], description: "A flexible database and spreadsheet hybrid for organizing work.", },
    { id: 11, name: "Shopify", icon: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Shopify_logo_2018.svg", tools: ["Manage Products", "Process Orders", "Update Inventory", "Customer Management", "Sales Analytics"], description: "An e-commerce platform for building online stores.", }
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
    { id: 1, name: "Claude Opus 4", description: "Powerful, large model for complex challenges", provider: "Anthropic", },
    { id: 2, name: "GPT-4 Turbo", description: "Latest OpenAI model with strong reasoning", provider: "OpenAI", },
    { id: 3, name: "GPT-3.5 Turbo", description: "Fast and cost-effective assistant", provider: "OpenAI", },
    { id: 4, name: "Claude Sonnet 4", description: "Smart, efficient model for everyday use", provider: "Anthropic", },
    { id: 5, name: "Claude Haiku", description: "Ultra-fast model for simple tasks", provider: "Anthropic", },
    { id: 6, name: "Gemini Pro", description: "Google's powerful multimodal model", provider: "Google", },
    { id: 7, name: "Llama 3 70B", description: "Meta's open model with strong capabilities", provider: "Meta", },
    { id: 8, name: "Mistral Large", description: "High-performance model with strong reasoning", provider: "Mistral AI", },
    { id: 9, name: "Gemini Ultra", description: "Google's most advanced multimodal model", provider: "Google", },
    { id: 10, name: "Llama 3 8B", description: "Efficient open model for everyday tasks", provider: "Meta", },
    { id: 11, name: "Command R+", description: "Cohere's powerful reasoning model", provider: "Cohere", },
    { id: 12, name: "Mixtral 8x7B", description: "High-quality mixture of experts model", provider: "Mistral AI", }
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
  ], { ignoreDuplicates: true });
}