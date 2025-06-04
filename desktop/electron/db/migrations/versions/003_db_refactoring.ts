import { DataTypes, QueryInterface } from "sequelize";
import Agent_User_MCP from "../../models/agent-user-mcp.model.js";
import ApiKey from "../../models/api-key.model.js";
import User_MCP from "../../models/user-mcp.model.js";
import { BaseMigration } from "../Migration.js";

/*
APIKeys -> ApiKeys (casing shouldn't matter)
APIKeys.mcpId -> ApiKeys.userMcpId

Agents_MCPs -> Agent_User_MCPs
Agents_MCPs.mcpId -> Agent_User_MCPs.userMcpId

Users_MCPs -> User_MCPs
Users_MCPs.MCPId -> User_MCPs.mcpId (casing shouldn't matter)
Users_MCPs.UserId -> User_MCPs.userId (casing shouldn't matter)
  */
export class DbRefactoringMigration extends BaseMigration {
  id = "202550604_131800_db_refactoring";
  name = "Refactor database schema. (apikey now has usermcp instead of mcp)";

  async up(queryInterface: QueryInterface): Promise<void> {

    // Rename tables
    await queryInterface.renameTable('Agents_MCPs', 'Agent_User_MCPs');
    await queryInterface.renameTable('Users_MCPs', 'User_MCPs');

    // Update ApiKeys table to reference User_MCP instead of MCP
    // First, add the new userMcpId column
    await queryInterface.addColumn(ApiKey.tableName, 'userMcpId', {
      type: DataTypes.INTEGER,
      allowNull: true, // temporarily allow null during migration
      references: {
        model: User_MCP.tableName,
        key: 'id',
      },
    });

    // Populate userMcpId based on existing mcpId and userId
    await queryInterface.sequelize.query(`
      UPDATE "${ApiKey.tableName}" 
      SET "userMcpId" = (
        SELECT "${User_MCP.tableName}"."id" 
        FROM "${User_MCP.tableName}" 
        WHERE "${User_MCP.tableName}"."mcpId" = "${ApiKey.tableName}"."mcpId" 
        AND "${User_MCP.tableName}"."userId" = "${ApiKey.tableName}"."userId"
      )
    `);

    // add userMcpId to Agent_User_MCPs
    await queryInterface.addColumn(Agent_User_MCP.tableName, 'userMcpId', {
      type: DataTypes.INTEGER,
      allowNull: true, // temporarily allow null during migration
      references: {
        model: User_MCP.tableName,
        key: 'id',
      },
    });

    // Populate userMcpId in Agent_User_MCPs based on existing mcpId and userId from agent table
    await queryInterface.sequelize.query(`
      UPDATE "${Agent_User_MCP.tableName}"
      SET "userMcpId" = (
        SELECT "${User_MCP.tableName}"."id"
        FROM "${User_MCP.tableName}"
        WHERE "${User_MCP.tableName}"."mcpId" = "${Agent_User_MCP.tableName}"."mcpId"
        AND "${User_MCP.tableName}"."userId" = (
          SELECT "userId"
          FROM "Agents"
          WHERE "Agents"."id" = "${Agent_User_MCP.tableName}"."agentId"
        )
      )
    `);
  }

  async down(queryInterface: QueryInterface): Promise<void> {
    // Remove userMcpId column from Agent_User_MCPs table
    await queryInterface.removeColumn(Agent_User_MCP.tableName, 'userMcpId');

    // Remove userMcpId column from ApiKeys table
    await queryInterface.removeColumn(ApiKey.tableName, 'userMcpId');

    // Rename tables back to original names
    await queryInterface.renameTable('User_MCPs', 'Users_MCPs');
    await queryInterface.renameTable('Agent_User_MCPs', 'Agents_MCPs');
  }
}
