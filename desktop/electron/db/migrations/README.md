# Database Migration System

This directory contains a simple but robust database migration system for the Electron application.

## How It Works

The migration system automatically runs when the application starts, ensuring your database schema is always up to date without manual intervention.

### Key Features

- **Automatic Migration**: Migrations run automatically when the app starts
- **Transaction Safety**: All migrations in a batch run within a transaction
- **Version Tracking**: Tracks which migrations have been executed
- **Environment Aware**: Different behavior for development vs production


## Creating a New Migration

1. **Create a migration file**: Follow the naming convention `XXX_description.ts`
   ```
   002_add_user_preferences.ts
   003_update_chat_schema.ts
   ```

2. **Implement the migration**:
   ```typescript
   import { DataTypes, QueryInterface, Sequelize } from "sequelize";
   import { BaseMigration } from "./Migration.js";

   export class AddUserPreferencesMigration extends BaseMigration {
     id = "20240602_130000_add_user_preferences";
     name = "Add user preferences table";

     async up(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
       await queryInterface.createTable('UserPreferences', {
         id: {
           type: DataTypes.INTEGER,
           primaryKey: true,
           autoIncrement: true,
         },
         userId: {
           type: DataTypes.STRING,
           allowNull: false,
         },
         // ... other columns
       });
     }

     async down(queryInterface: QueryInterface, sequelize: Sequelize): Promise<void> {
       await queryInterface.dropTable('UserPreferences');
     }
   }
   ```

3. **Register the migration** in `migrations.ts`:
   ```typescript
   import { AddUserPreferencesMigration } from "./002_add_user_preferences.js";

   export const migrations: Migration[] = [
     new AddVersionTrackingMigration(),
     new AddUserPreferencesMigration(), // Add your new migration here
   ];
   ```

## Migration ID Format

Use the format: `YYYYMMDD_HHMMSS_description`
- `YYYYMMDD`: Date (e.g., 20240602)
- `HHMMSS`: Time (e.g., 120000 for 12:00:00)
- `description`: Brief description

This ensures migrations run in chronological order.

## Common Migration Operations

### Adding a Column
```typescript
await queryInterface.addColumn('TableName', 'columnName', {
  type: DataTypes.STRING,
  allowNull: true,
  defaultValue: 'default_value'
});
```

### Removing a Column
```typescript
await queryInterface.removeColumn('TableName', 'columnName');
```

### Creating a Table
```typescript
await queryInterface.createTable('NewTable', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // ... other columns
});
```

### Adding an Index
```typescript
await queryInterface.addIndex('TableName', ['columnName'], {
  name: 'idx_table_column'
});
```

### Raw SQL
```typescript
await queryInterface.sequelize.query(`
  UPDATE TableName SET column = 'new_value' WHERE condition = true
`);
```

## Automatic Execution

Migrations run automatically during the `Database.registerModel()` phase:

1. Check for pending migrations
2. Run all pending migrations in order
3. Update version tracking
4. Continue with normal database sync


## Best Practices

1. **Always test migrations** in development first
2. **Keep migrations small** and focused on one change
3. **Write reversible migrations** (implement both `up` and `down`)
4. **Never modify existing migrations** once they're in production
5. **Use transactions** for complex migrations (handled automatically)
6. **Backup data** before running migrations in production
