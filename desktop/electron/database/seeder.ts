import { and, eq } from "drizzle-orm";
import { AuthHandler } from "../helpers/auth-handler.js";
import { database } from "./database.js";
import { agent, agent_style, api_key, llm, mcp, setting, user_mcp } from "./tables/index.js";

export async function seedDatabase() {
  await seedDefaultSettings();

  // create mcp servers
  const mcpServers: typeof mcp.$inferInsert[] = [
    { id: 1, name: "AWS Services", icon: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg", tools: [{ name: "S3 Storage", id: "1" }, { name: "Lambda Functions", id: "2" }, { name: "EC2 Instances", id: "3" }, { name: "DynamoDB", id: "4" }, { name: "CloudWatch", id: "5" }, { name: "IAM Management", id: "6" }, { name: "RDS Databases", id: "7" }, { name: "Elastic Beanstalk", id: "8" }, { name: "ECS Containers", id: "9" }, { name: "EKS Kubernetes", id: "10" }, { name: "API Gateway", id: "11" }, { name: "CloudFront CDN", id: "12" }, { name: "Route 53 DNS", id: "13" }, { name: "SQS Queues", id: "14" }, { name: "SNS Notifications", id: "15" }, { name: "CloudFormation", id: "16" }, { name: "Elastic Load Balancer", id: "17" }, { name: "Auto Scaling", id: "18" }, { name: "CloudTrail Logging", id: "19" }, { name: "AWS Config", id: "20" }, { name: "VPC Management", id: "21" }, { name: "Direct Connect", id: "22" }, { name: "AWS Backup", id: "23" }, { name: "AWS Shield", id: "24" }, { name: "WAF Security", id: "25" }, { name: "Cognito Authentication", id: "26" }, { name: "KMS Encryption", id: "27" }, { name: "Secrets Manager", id: "28" }, { name: "Systems Manager", id: "29" }, { name: "CloudWatch Events", id: "30" }, { name: "EventBridge", id: "31" }, { name: "Step Functions", id: "32" }, { name: "AppSync GraphQL", id: "33" }, { name: "Amplify Development", id: "34" }, { name: "CodeBuild", id: "35" }, { name: "CodePipeline", id: "36" }, { name: "CodeDeploy", id: "37" }, { name: "CodeCommit", id: "38" }, { name: "X-Ray Tracing", id: "39" }, { name: "CloudWatch Logs", id: "40" }, { name: "AWS Batch", id: "41" }, { name: "Elastic MapReduce", id: "42" }, { name: "Redshift Data Warehouse", id: "43" }, { name: "ElastiCache", id: "44" }, { name: "DocumentDB", id: "45" }, { name: "Neptune Graph DB", id: "46" }, { name: "Timestream", id: "47" }, { name: "OpenSearch", id: "48" }, { name: "Athena Query", id: "49" }, { name: "QuickSight Analytics", id: "50" }, { name: "SageMaker ML", id: "51" }], description: "A collection of AWS services for cloud computing." },
    { id: 2, name: "GitHub", icon: "https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png", tools: [{ name: "Create Issues", id: "1" }, { name: "Update PRs", id: "2" }, { name: "Code Search", id: "3" }, { name: "Create Repository", id: "4" }, { name: "Clone Repository", id: "5" }, { name: "Manage Branches", id: "6" }], description: "A platform for version control and collaboration." },
    { id: 3, name: "Slack", icon: "https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png", tools: [{ name: "Post Messages", id: "1" }, { name: "Create Channels", id: "2" }, { name: "Add Users", id: "3" }, { name: "Search History", id: "4" }, { name: "Set Status", id: "5" }], description: "A messaging app for teams to communicate and collaborate." },
    { id: 4, name: "Google Drive", icon: "https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg", tools: [{ name: "Upload Files", id: "1" }, { name: "Create Documents", id: "2" }, { name: "Share Files", id: "3" }, { name: "Download Files", id: "4" }, { name: "Search Files", id: "5" }, { name: "Create Folders", id: "6" }], description: "A cloud storage service for file management and collaboration." },
    { id: 5, name: "Microsoft 365", icon: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Microsoft_365_%282022%29.svg", tools: [{ name: "Edit Word Documents", id: "1" }, { name: "Create Excel Spreadsheets", id: "2" }, { name: "Manage Calendar", id: "3" }, { name: "Send Emails", id: "4" }, { name: "Schedule Meetings", id: "5" }], description: "A suite of productivity applications for business and personal use." },
    { id: 6, name: "Jira", icon: "https://wac-cdn.atlassian.com/assets/img/favicons/atlassian/favicon.png", tools: [{ name: "Create Tickets", id: "1" }, { name: "Update Stories", id: "2" }, { name: "Manage Sprints", id: "3" }, { name: "Track Time", id: "4" }, { name: "Generate Reports", id: "5" }], description: "A project management tool for agile teams to plan and track work." },
    { id: 7, name: "Salesforce", icon: "https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg", tools: [{ name: "Create Leads", id: "1" }, { name: "Update Contacts", id: "2" }, { name: "Manage Opportunities", id: "3" }, { name: "Generate Reports", id: "4" }, { name: "Schedule Tasks", id: "5" }], description: "A customer relationship management (CRM) platform for sales and marketing." },
    { id: 8, name: "Stripe", icon: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg", tools: [{ name: "Process Payments", id: "1" }, { name: "Create Invoices", id: "2" }, { name: "Manage Subscriptions", id: "3" }, { name: "Handle Refunds", id: "4" }, { name: "Track Revenue", id: "5" }], description: "A payment processing platform for online businesses." },
    { id: 9, name: "Asana", icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Asana_logo.svg/1200px-Asana_logo.svg.png", tools: [{ name: "Create Tasks", id: "1" }, { name: "Manage Projects", id: "2" }, { name: "Assign Work", id: "3" }, { name: "Set Deadlines", id: "4" }, { name: "Track Progress", id: "5" }], description: "A work management platform to help teams organize and track their work." },
    { id: 10, name: "Airtable", icon: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Airtable_Logo.svg", tools: [{ name: "Create Tables", id: "1" }, { name: "Update Records", id: "2" }, { name: "Filter Data", id: "3" }, { name: "Export Data", id: "4" }, { name: "Connect Bases", id: "5" }], description: "A flexible database and spreadsheet hybrid for organizing work." },
    { id: 11, name: "Shopify", icon: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Shopify_logo_2018.svg", tools: [{ name: "Manage Products", id: "1" }, { name: "Process Orders", id: "2" }, { name: "Update Inventory", id: "3" }, { name: "Customer Management", id: "4" }, { name: "Sales Analytics", id: "5" }], description: "An e-commerce platform for building online stores." }
  ]
  await Promise.all(mcpServers.map(server => {
    const func = async () => {
      // create or update mcp server
      await database()
        .insert(mcp)
        .values(server)
        .onConflictDoUpdate({
          target: mcp.id,
          set: {
            name: server.name,
            icon: server.icon,
            tools: server.tools,
            description: server.description
          }
        });

      // create user mcp associations if they don't exist
      await database()
        .insert(user_mcp)
        .values({
          mcp_id: server.id!,
          user_id: AuthHandler.profile!.sub,
          is_active: false,
          is_installed: false
        })
        .onConflictDoNothing()
        .returning();

      const [userMcp] = await database()
        .select()
        .from(user_mcp)
        .where(and(
          eq(user_mcp.user_id, AuthHandler.profile!.sub),
          eq(user_mcp.mcp_id, server.id!)
        ))

      // create dummy API keys for the user
      await database()
        .insert(api_key)
        .values([
          { name: `Dummy Key for ${server.name}-1`, user_mcp_id: userMcp.id!, value: `dummy-key-${server.id}-${AuthHandler.profile!.sub}-1`, user_id: AuthHandler.profile!.sub },
          { name: `Dummy Key for ${server.name}-2`, user_mcp_id: userMcp.id!, value: `dummy-key-${server.id}-${AuthHandler.profile!.sub}-2`, user_id: AuthHandler.profile!.sub }
        ])
        .onConflictDoNothing();

    }
    return func();
  }))


  // agent styles
  const styles: typeof agent_style.$inferInsert[] = [
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
    { id: 12, type: 'style', name: 'Storytelling', description: 'A narrative and engaging style.' }
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
          description: style.description
        }
      })
  )))

  // local llm
  const llms: typeof llm.$inferInsert[] = [
    { id: 1, display_name: "Mistral Nemo", description: "A powerful, open-source model for complex tasks", provider: "Mistral AI", model: 'mistral-nemo', model_path: 'mistral-nemo.gguf', is_default: true },
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
          model: llmData.model
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
        llm_id: 1,
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
  ]
  await Promise.all(settings.map(settingData => (
    database()
      .insert(setting)
      .values(settingData)
      .onConflictDoNothing()
  )));
}