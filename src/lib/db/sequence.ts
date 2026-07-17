// lib/db/sequence.ts
import { db } from '@/lib/db/client';
import { sql } from 'drizzle-orm';

/**
 * Ensure a PostgreSQL sequence is in sync with the table's max id
 * @param sequenceName - The name of the sequence (e.g., 'music_albums_id_seq')
 * @param tableName - The name of the table (e.g., 'music_albums')
 * @param idColumn - The name of the id column (default: 'id')
 * @returns The new next value for the sequence
 */
export async function ensureSequenceSync(
  sequenceName: string,
  tableName: string,
  idColumn: string = 'id'
): Promise<number> {
  try {
    // Get the current max id in the table
    const [maxResult] = await db
      .select({ maxId: sql<number>`COALESCE(MAX(${sql.identifier(idColumn)}), 0)` })
      .from(sql.identifier(tableName));
    
    const maxId = maxResult?.maxId || 0;
    const nextVal = maxId + 1;
    
    // Reset the sequence to max_id + 1
    await db.execute(sql`
      SELECT setval(${sequenceName}, ${nextVal})
    `);
    
    console.log(`✅ Sequence ${sequenceName} synced to ${nextVal} (max id: ${maxId})`);
    return nextVal;
  } catch (error) {
    console.error(`Error syncing sequence ${sequenceName}:`, error);
    return 0;
  }
}

/**
 * Get the sequence name for a given table and column
 * @param tableName - The name of the table
 * @param idColumn - The name of the id column (default: 'id')
 * @returns The sequence name
 */
export function getSequenceName(tableName: string, idColumn: string = 'id'): string {
  return `${tableName}_${idColumn}_seq`;
}

/**
 * Ensure sequence is synced for a specific table
 * @param tableName - The name of the table
 * @param idColumn - The name of the id column (default: 'id')
 * @returns The new next value for the sequence
 */
export async function ensureTableSequence(
  tableName: string,
  idColumn: string = 'id'
): Promise<number> {
  const sequenceName = getSequenceName(tableName, idColumn);
  return ensureSequenceSync(sequenceName, tableName, idColumn);
}