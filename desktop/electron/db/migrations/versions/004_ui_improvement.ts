import { DataTypes, QueryInterface, QueryTypes } from "sequelize";
import LLM from "../../models/llm.model.js";
import { BaseMigration } from "../Migration.js";

/*
LLM table has description column
default values of llm changed

default values of mcp tools changed
  */
export class UiImprovementsMigration extends BaseMigration {
  id = "20250605_2310000_ui_improvement";
  name = "UI improvement. dbb change required mainly for seeders";

  async up(queryInterface: QueryInterface): Promise<void> {
    // Add description column to LLM table
    await queryInterface.addColumn('LLMs', 'description', {
      type: DataTypes.STRING,
      allowNull: true,
    });

    // //update default values of LLMs. id 1
    const newLLM = [
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
    ]

    for (const llm of newLLM) {
      const existingLLM = await queryInterface.sequelize.query(`
        SELECT * FROM "${LLM.tableName}" WHERE "id" = ${llm.id}
      `, { type: QueryTypes.SELECT });
      if (existingLLM.length > 0) {
        // If LLM already exists, update it
        await queryInterface.sequelize.query(`
          UPDATE "${LLM.tableName}"
          SET "name" = '${llm.name.replace(/'/g, "''")}',
          "description" = '${llm.description.replace(/'/g, "''")}',
          "provider" = '${llm.provider.replace(/'/g, "''")}',
          "updatedAt" = '${new Date().toISOString()}'
          WHERE "id" = ${llm.id};
        `);
      } else {
        // If LLM does not exist, insert it
        await queryInterface.sequelize.query(`
          INSERT INTO "${LLM.tableName}" ("id", "name", "description", "provider", "createdAt", "updatedAt")
          VALUES (${llm.id}, '${llm.name.replace(/'/g, "''")}', '${llm.description.replace(/'/g, "''")}', '${llm.provider.replace(/'/g, "''")}', '${new Date().toISOString()}', '${new Date().toISOString()}');
        `);
      }
    }

    const newMcpServers = [
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
    ]

    for (const mcp of newMcpServers) {
      const existingMCP = await queryInterface.sequelize.query(`
        SELECT * FROM "MCPs" WHERE "id" = ${mcp.id}
      `, { type: QueryTypes.SELECT });

      const sameNameMCP = await queryInterface.sequelize.query(`
        SELECT * FROM "MCPs" WHERE "name" = '${mcp.name.replace(/'/g, "''")}'
      `, { type: QueryTypes.SELECT });

      // if there is old mcp with same name, but different id, then we need update old mcp name temporarily
      if (sameNameMCP.length > 0 && (sameNameMCP[0] as any).id !== mcp.id) {
        await queryInterface.sequelize.query(`
          UPDATE "MCPs"
          SET "name" = '${mcp.name.replace(/'/g, "''")}_old',
          "updatedAt" = '${new Date().toISOString()}'
          WHERE "id" = ${(sameNameMCP[0] as any).id};
        `);
      }


      if (existingMCP.length > 0) {
        // If MCP already exists, update it
        await queryInterface.sequelize.query(`
          UPDATE "MCPs"
          SET "name" = '${mcp.name.replace(/'/g, "''")}',
          "icon" = '${mcp.icon.replace(/'/g, "''")}',
          "description" = '${mcp.description.replace(/'/g, "''")}',
          "updatedAt" = '${new Date().toISOString()}'
          WHERE "id" = ${mcp.id};
        `);
      } else {
        // If MCP does not exist, insert it
        await queryInterface.sequelize.query(`
          INSERT INTO "MCPs" ("id", "name", "icon", "description", "createdAt", "updatedAt")
          VALUES (${mcp.id}, '${mcp.name.replace(/'/g, "''")}', '${mcp.icon.replace(/'/g, "''")}', '${mcp.description.replace(/'/g, "''")}', '${new Date().toISOString()}', '${new Date().toISOString()}');
        `);
      }
    }

  }

  async down(queryInterface: QueryInterface): Promise<void> {
    // Remove description column from LLM table
    await queryInterface.removeColumn('LLMs', 'description');
  }
}
