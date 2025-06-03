import { DataTypes, QueryInterface } from "sequelize";
import { BaseMigration } from "../Migration.js";

export class AddSelectedToolsMigration extends BaseMigration {
  id = "202550602_2233000_add_selected_tools";
  name = "Add selected_tools to Agents_MCPs table";

  async up(queryInterface: QueryInterface): Promise<void> {
    // Add a new column to the Agents_MCPs table for selected tools
    await queryInterface.addColumn('Agents_MCPs', 'selected_tools', {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Array of selected tool names for this MCP server",
    });
  }

  async down(queryInterface: QueryInterface): Promise<void> {
    // Remove the selected_tools column from the Agents_MCPs table
    await queryInterface.removeColumn('Agents_MCPs', 'selected_tools');
  }
}
