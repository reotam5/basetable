import { and, eq } from "drizzle-orm";
import { AuthHandler } from "../helpers/auth-handler.js";
import { database } from "./database.js";
import { agent, agent_style, api_key, llm, setting } from "./tables/index.js";
import { mcp_server } from "./tables/mcp-server.js";

export async function seedDatabase() {
  await seedDefaultSettings();

  // create mcp servers
  const mcpServers: typeof mcp_server.$inferInsert[] = [
    { type: "preset", user_id: AuthHandler.profile!.sub, name: "AWS Services", icon: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg", available_tools: [{ title: "S3 Storage", name: "s3_storage", id: "1" }, { title: "Lambda Functions", name: "lambda_functions", id: "2" }, { title: "EC2 Instances", name: "ec2_instances", id: "3" }, { title: "DynamoDB", name: "dynamo_db", id: "4" }, { title: "CloudWatch", name: "cloud_watch", id: "5" }, { title: "IAM Management", name: "iam_management", id: "6" }, { title: "RDS Databases", name: "rds_databases", id: "7" }, { title: "Elastic Beanstalk", name: "elastic_beanstalk", id: "8" }, { title: "ECS Containers", name: "ecs_containers", id: "9" }, { title: "EKS Kubernetes", name: "eks_kubernetes", id: "10" }, { title: "API Gateway", name: "api_gateway", id: "11" }, { title: "CloudFront CDN", name: "cloud_front_cdn", id: "12" }, { title: "Route 53 DNS", name: "route_53_dns", id: "13" }, { title: "SQS Queues", name: "sqs_queues", id: "14" }, { title: "SNS Notifications", name: "sns_notifications", id: "15" }, { title: "CloudFormation", name: "cloud_formation", id: "16" }, { title: "Elastic Load Balancer", name: "elastic_load_balancer", id: "17" }, { title: "Auto Scaling", name: "auto_scaling", id: "18" }, { title: "CloudTrail Logging", name: "cloud_trail_logging", id: "19" }, { title: "AWS Config", name: "aws_config", id: "20" }, { title: "VPC Management", name: "vpc_management", id: "21" }, { title: "Direct Connect", name: "direct_connect", id: "22" }, { title: "AWS Backup", name: "aws_backup", id: "23" }, { title: "AWS Shield", name: "aws_shield", id: "24" }, { title: "WAF Security", name: "waf_security", id: "25" }, { title: "Cognito Authentication", name: "cognito_authentication", id: "26" }, { title: "KMS Encryption", name: "kms_encryption", id: "27" }, { title: "Secrets Manager", name: "secrets_manager", id: "28" }, { title: "Systems Manager", name: "systems_manager", id: "29" }, { title: "CloudWatch Events", name: "cloud_watch_events", id: "30" }, { title: "EventBridge", name: "event_bridge", id: "31" }, { title: "Step Functions", name: "step_functions", id: "32" }, { title: "AppSync GraphQL", name: "app_sync_graph_ql", id: "33" }, { title: "Amplify Development", name: "amplify_development", id: "34" }, { title: "CodeBuild", name: "code_build", id: "35" }, { title: "CodePipeline", name: "code_pipeline", id: "36" }, { title: "CodeDeploy", name: "code_deploy", id: "37" }, { title: "CodeCommit", name: "code_commit", id: "38" }, { title: "X-Ray Tracing", name: "x_ray_tracing", id: "39" }, { title: "CloudWatch Logs", name: "cloud_watch_logs", id: "40" }, { title: "AWS Batch", name: "aws_batch", id: "41" }, { title: "Elastic MapReduce", name: "elastic_map_reduce", id: "42" }, { title: "Redshift Data Warehouse", name: "redshift_data_warehouse", id: "43" }, { title: "ElastiCache", name: "elasti_cache", id: "44" }, { title: "DocumentDB", name: "document_db", id: "45" }, { title: "Neptune Graph DB", name: "neptune_graph_db", id: "46" }, { title: "Timestream", name: "timestream", id: "47" }, { title: "OpenSearch", name: "open_search", id: "48" }, { title: "Athena Query", name: "athena_query", id: "49" }, { title: "QuickSight Analytics", name: "quick_sight_analytics", id: "50" }, { title: "SageMaker ML", name: "sage_maker_ml", id: "51" }], description: "A collection of AWS services for cloud computing." },
    { type: "preset", user_id: AuthHandler.profile!.sub, name: "GitHub", icon: "https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png", available_tools: [{ title: "Create Issues", name: "create_issues", id: "1" }, { title: "Update PRs", name: "update_prs", id: "2" }, { title: "Code Search", name: "code_search", id: "3" }, { title: "Create Repository", name: "create_repository", id: "4" }, { title: "Clone Repository", name: "clone_repository", id: "5" }, { title: "Manage Branches", name: "manage_branches", id: "6" }], description: "A platform for version control and collaboration." },
    { type: "preset", user_id: AuthHandler.profile!.sub, name: "Slack", icon: "https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png", available_tools: [{ title: "Post Messages", name: "post_messages", id: "1" }, { title: "Create Channels", name: "create_channels", id: "2" }, { title: "Add Users", name: "add_users", id: "3" }, { title: "Search History", name: "search_history", id: "4" }, { title: "Set Status", name: "set_status", id: "5" }], description: "A messaging app for teams to communicate and collaborate." },
    { type: "preset", user_id: AuthHandler.profile!.sub, name: "Google Drive", icon: "https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg", available_tools: [{ title: "Upload Files", name: "upload_files", id: "1" }, { title: "Create Documents", name: "create_documents", id: "2" }, { title: "Share Files", name: "share_files", id: "3" }, { title: "Download Files", name: "download_files", id: "4" }, { title: "Search Files", name: "search_files", id: "5" }, { title: "Create Folders", name: "create_folders", id: "6" }], description: "A cloud storage service for file management and collaboration." },
    { type: "preset", user_id: AuthHandler.profile!.sub, name: "Microsoft 365", icon: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Microsoft_365_%282022%29.svg", available_tools: [{ title: "Edit Word Documents", name: "edit_word_documents", id: "1" }, { title: "Create Excel Spreadsheets", name: "create_excel_spreadsheets", id: "2" }, { title: "Manage Calendar", name: "manage_calendar", id: "3" }, { title: "Send Emails", name: "send_emails", id: "4" }, { title: "Schedule Meetings", name: "schedule_meetings", id: "5" }], description: "A suite of productivity applications for business and personal use." },
    { type: "preset", user_id: AuthHandler.profile!.sub, name: "Jira", icon: "https://wac-cdn.atlassian.com/assets/img/favicons/atlassian/favicon.png", available_tools: [{ title: "Create Tickets", name: "create_tickets", id: "1" }, { title: "Update Stories", name: "update_stories", id: "2" }, { title: "Manage Sprints", name: "manage_sprints", id: "3" }, { title: "Track Time", name: "track_time", id: "4" }, { title: "Generate Reports", name: "generate_reports", id: "5" }], description: "A project management tool for agile teams to plan and track work." },
    { type: "preset", user_id: AuthHandler.profile!.sub, name: "Salesforce", icon: "https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg", available_tools: [{ title: "Create Leads", name: "create_leads", id: "1" }, { title: "Update Contacts", name: "update_contacts", id: "2" }, { title: "Manage Opportunities", name: "manage_opportunities", id: "3" }, { title: "Generate Reports", name: "generate_reports", id: "4" }, { title: "Schedule Tasks", name: "schedule_tasks", id: "5" }], description: "A customer relationship management (CRM) platform for sales and marketing." },
    { type: "preset", user_id: AuthHandler.profile!.sub, name: "Stripe", icon: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg", available_tools: [{ title: "Process Payments", name: "process_payments", id: "1" }, { title: "Create Invoices", name: "create_invoices", id: "2" }, { title: "Manage Subscriptions", name: "manage_subscriptions", id: "3" }, { title: "Handle Refunds", name: "handle_refunds", id: "4" }, { title: "Track Revenue", name: "track_revenue", id: "5" }], description: "A payment processing platform for online businesses." },
    { type: "preset", user_id: AuthHandler.profile!.sub, name: "Asana", icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Asana_logo.svg/1200px-Asana_logo.svg.png", available_tools: [{ title: "Create Tasks", name: "create_tasks", id: "1" }, { title: "Manage Projects", name: "manage_projects", id: "2" }, { title: "Assign Work", name: "assign_work", id: "3" }, { title: "Set Deadlines", name: "set_deadlines", id: "4" }, { title: "Track Progress", name: "track_progress", id: "5" }], description: "A work management platform to help teams organize and track their work." },
    { type: "preset", user_id: AuthHandler.profile!.sub, name: "Airtable", icon: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Airtable_Logo.svg", available_tools: [{ title: "Create Tables", name: "create_tables", id: "1" }, { title: "Update Records", name: "update_records", id: "2" }, { title: "Filter Data", name: "filter_data", id: "3" }, { title: "Export Data", name: "export_data", id: "4" }, { title: "Connect Bases", name: "connect_bases", id: "5" }], description: "A flexible database and spreadsheet hybrid for organizing work." },
    { type: "preset", user_id: AuthHandler.profile!.sub, name: "Shopify", icon: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Shopify_logo_2018.svg", available_tools: [{ title: "Manage Products", name: "manage_products", id: "1" }, { title: "Process Orders", name: "process_orders", id: "2" }, { title: "Update Inventory", name: "update_inventory", id: "3" }, { title: "Customer Management", name: "customer_management", id: "4" }, { title: "Sales Analytics", name: "sales_analytics", id: "5" }], description: "An e-commerce platform for building online stores." }
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