import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Next.js development uses .env.local. Drizzle runs as a standalone CLI, so
// load that file explicitly and retain .env as a lower-priority fallback.
config({ path: '.env.local' });
config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in .env.local or .env');
}

export default defineConfig({
  schema: "./src/libraries/schema/index.ts",
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // Print the proposed changes and require confirmation before applying them.
  verbose: true,
  strict: true,
});
