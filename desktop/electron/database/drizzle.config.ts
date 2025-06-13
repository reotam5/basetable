import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './electron/database/migrations',
  schema: './dist/main/database/tables/index.js',
  dialect: 'sqlite',
  strict: true,
  verbose: true,
});