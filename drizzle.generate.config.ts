import { defineConfig } from 'drizzle-kit';

// Offline schema generation: the central index exports the authoritative
// src/libraries/schema/threed/index.ts alongside the other App modules.
export default defineConfig({
  schema: './src/libraries/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
});
