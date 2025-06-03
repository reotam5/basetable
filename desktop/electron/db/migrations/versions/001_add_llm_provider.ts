import { DataTypes, QueryInterface } from "sequelize";
import { BaseMigration } from "../Migration.js";

export class AddLLMProviderMigration extends BaseMigration {
  id = "202550602_223000_add_llm_provider";
  name = "Add llm provider to llm table";

  async up(queryInterface: QueryInterface): Promise<void> {
    // Add a new column to the LLM table for provider and provides values

    await queryInterface.addColumn('LLMs', 'provider', {
      type: DataTypes.ENUM('OpenAI', 'Anthropic', 'Google', 'Azure', 'Other'),
      allowNull: false,
      defaultValue: 'Other',
      comment: 'Provider of the LLM, e.g., openai, anthropic, etc.'
    });

    // fill values for existing entries
    await queryInterface.sequelize.query(`
      UPDATE "LLMs"
      SET "provider" = CASE
        WHEN "name" LIKE '%GPT-4%' THEN 'OpenAI'
        WHEN "name" LIKE '%GPT-3.5%' THEN 'OpenAI'
        WHEN "name" LIKE '%Gemini%' THEN 'Google'
        WHEN "name" LIKE '%Claude 3 Opus%' THEN 'Anthropic'
        WHEN "name" LIKE '%Claude 3 Sonnet%' THEN 'Anthropic'
        ELSE 'Other'
      END
    `);
  }

  async down(queryInterface: QueryInterface): Promise<void> {
    // Remove the provider column from the LLM table
    await queryInterface.removeColumn('LLMs', 'provider');
  }
}
