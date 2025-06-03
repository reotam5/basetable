import { Migration } from "../Migration.js";
import { AddLLMProviderMigration } from "./001_add_llm_provider.js";
import { AddSelectedToolsMigration } from "./002_add_selected_tools.js";

// Register all migrations in chronological order
export const migrations: Migration[] = [
  new AddLLMProviderMigration(),
  new AddSelectedToolsMigration()
];
