import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import * as authSchema from "@/lib/schema";

// Reuse the development pool across Next.js module reloads. Production retains
// module-level pooling and Vercel's existing lifecycle integration.
const globalForDatabase = globalThis as typeof globalThis & { threeDDatabasePool?: Pool };
function createPool() {
  const created = new Pool({ connectionString: process.env.DATABASE_URL });
  created.on('error', (error: Error & { code?: string }) => {
    // Avoid emitting connection details or credentials for idle-client errors.
    console.error('Database idle connection error', { code: error.code ?? 'UNKNOWN' });
  });
  attachDatabasePool(created);
  return created;
}
const pool = process.env.NODE_ENV === 'development'
  ? (globalForDatabase.threeDDatabasePool ??= createPool())
  : createPool();

// Create Drizzle instance with the pool and schema
// Combine all schema files here
export const db = drizzle(pool, { schema: { ...authSchema } });

// Database connection check function
export async function checkDbConnection(): Promise<string> {
  if (!process.env.DATABASE_URL) {
    return "No DATABASE_URL environment variable";
  }
  try {
    await pool.query("SELECT version()");
    return "Database connected";
  } catch (error) {
    console.error("Error connecting to the database:", error);
    return "Database not connected";
  }
}

// ### CalTrans

// Type helper for transactions
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
