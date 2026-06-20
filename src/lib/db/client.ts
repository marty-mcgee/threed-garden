import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import * as authSchema from "@/lib/schema";

// Create the connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Attach to Vercel's serverless function pool (for Vercel deployments)
attachDatabasePool(pool);

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
