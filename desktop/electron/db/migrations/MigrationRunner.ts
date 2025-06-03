import { QueryInterface, QueryTypes, Sequelize } from "sequelize";
import { Logger } from "../../helpers/Logger.js";
import { Migration, MigrationModel } from "./Migration.js";

export class MigrationRunner {
  private sequelize: Sequelize;
  private queryInterface: QueryInterface;
  private migrations: Migration[] = [];

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
    this.queryInterface = sequelize.getQueryInterface();
  }

  /**
   * Register migrations to be managed by this runner
   */
  public registerMigrations(migrations: Migration[]): void {
    this.migrations = migrations.sort((a, b) => a.id.localeCompare(b.id));
  }

  /**
   * Check if this is a fresh installation (no core tables exist)
   */
  private async isFreshInstallation(): Promise<boolean> {
    try {
      const tables = await this.queryInterface.showAllTables();
      const coreTableNames = ['Settings', 'Users', 'Chats', 'Messages', 'Agents']; // Core model tables

      // If none of the core tables exist, this is a fresh installation
      const hasCoreTables = coreTableNames.some(tableName =>
        tables.some(table => table.toLowerCase() === tableName.toLowerCase())
      );

      return !hasCoreTables;
    } catch (error) {
      Logger.warn("Could not check tables for fresh installation detection:", error);
      return true; // Assume fresh installation on error
    }
  }

  /**
   * Initialize the migration system by creating the migration tracking table
   */
  private async initializeMigrationTable(): Promise<void> {
    try {
      const tableExists = await this.queryInterface.showAllTables().then(tables =>
        tables.some(table => table.toLowerCase() === 'migrations')
      );

      if (!tableExists) {
        Logger.info("Creating migrations table...");
        await this.queryInterface.createTable('migrations', MigrationModel.attributes);
        Logger.info("Migrations table created successfully");
      }
    } catch (error) {
      Logger.error("Failed to initialize migration table:", error);
      throw error;
    }
  }

  /**
   * Get list of executed migrations from the database
   */
  private async getExecutedMigrations(): Promise<string[]> {
    try {
      const results = await this.queryInterface.sequelize.query(
        'SELECT id FROM migrations ORDER BY id',
        { type: QueryTypes.SELECT }
      ) as Array<{ id: string }>;

      return results.map(result => result.id);
    } catch (error) {
      Logger.warn("Could not fetch executed migrations, assuming none executed:", error);
      return [];
    }
  }

  /**
   * Mark a migration as executed
   */
  private async markMigrationAsExecuted(migration: Migration): Promise<void> {
    await this.queryInterface.sequelize.query(
      'INSERT INTO migrations (id, name, executedAt) VALUES (?, ?, ?)',
      {
        replacements: [migration.id, migration.name, new Date()],
        type: QueryTypes.INSERT
      }
    );
  }

  /**
   * Remove migration record (for rollback)
   */
  private async removeMigrationRecord(migrationId: string): Promise<void> {
    await this.queryInterface.sequelize.query(
      'DELETE FROM migrations WHERE id = ?',
      {
        replacements: [migrationId],
        type: QueryTypes.DELETE
      }
    );
  }



  /**
   * Run all pending migrations
   */
  public async runMigrations(): Promise<void> {
    try {
      // Check if this is a fresh installation
      const isFresh = await this.isFreshInstallation();

      if (isFresh) {
        Logger.info("Fresh installation detected - skipping migrations, models will be synced directly");
        await this.initializeMigrationTable();

        // Mark all migrations as executed since we'll sync models directly
        for (const migration of this.migrations) {
          await this.markMigrationAsExecuted(migration);
        }

        Logger.info("All migrations marked as executed for fresh installation");
        return;
      }

      await this.initializeMigrationTable();

      const executedMigrations = await this.getExecutedMigrations();
      const pendingMigrations = this.migrations.filter(
        migration => !executedMigrations.includes(migration.id)
      );

      if (pendingMigrations.length === 0) {
        Logger.info("No pending migrations to run");
        return;
      }

      Logger.info(`Running ${pendingMigrations.length} pending migration(s)...`);

      // Use a transaction to ensure all migrations succeed or fail together
      const transaction = await this.sequelize.transaction();

      try {
        for (const migration of pendingMigrations) {
          Logger.info(`Running migration: ${migration.id} - ${migration.name}`);
          await migration.up(this.queryInterface, this.sequelize);
          await this.markMigrationAsExecuted(migration);
          Logger.info(`Migration completed: ${migration.id}`);
        }

        await transaction.commit();

        Logger.info("All migrations completed successfully");
      } catch (error) {
        await transaction.rollback();
        Logger.error("Migration transaction rolled back due to error:", error);
        throw error;
      }
    } catch (error) {
      Logger.error("Failed to run migrations:", error);
      throw new Error(`Migration execution failed: ${error}`);
    }
  }

  /**
   * Rollback the last migration
   */
  public async rollbackLastMigration(): Promise<void> {
    await this.initializeMigrationTable();

    const executedMigrations = await this.getExecutedMigrations();

    if (executedMigrations.length === 0) {
      Logger.info("No migrations to rollback");
      return;
    }

    const lastMigrationId = executedMigrations[executedMigrations.length - 1];
    const migration = this.migrations.find(m => m.id === lastMigrationId);

    if (!migration) {
      throw new Error(`Migration ${lastMigrationId} not found in registered migrations`);
    }

    try {
      Logger.info(`Rolling back migration: ${migration.id} - ${migration.name}`);
      await migration.down(this.queryInterface, this.sequelize);
      await this.removeMigrationRecord(migration.id);
      Logger.info(`Migration rollback completed: ${migration.id}`);
    } catch (error) {
      Logger.error(`Migration rollback failed: ${migration.id}`, error);
      throw new Error(`Migration rollback ${migration.id} failed: ${error}`);
    }
  }

  /**
   * Get installation type and migration status for debugging
   */
  public async getInstallationInfo(): Promise<{
    isFreshInstall: boolean;
    hasMigrationTable: boolean;
    existingTables: string[];
    migrationStatus: { executed: string[], pending: string[] };
  }> {
    const isFreshInstall = await this.isFreshInstallation();
    const tables = await this.queryInterface.showAllTables();
    const hasMigrationTable = tables.some(table => table.toLowerCase() === 'migrations');

    let migrationStatus: { executed: string[], pending: string[] } = { executed: [], pending: [] };
    try {
      migrationStatus = await this.getMigrationStatus();
    } catch (error) {
      Logger.warn("Could not get migration status:", error);
    }

    return {
      isFreshInstall,
      hasMigrationTable,
      existingTables: tables,
      migrationStatus
    };
  }

  /**
   * Get migration status
   */
  public async getMigrationStatus(): Promise<{ executed: string[], pending: string[] }> {
    await this.initializeMigrationTable();

    const executedMigrations = await this.getExecutedMigrations();
    const allMigrationIds = this.migrations.map(m => m.id);
    const pendingMigrations = allMigrationIds.filter(id => !executedMigrations.includes(id));

    return {
      executed: executedMigrations,
      pending: pendingMigrations
    };
  }
}
