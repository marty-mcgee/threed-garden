import 'server-only';
import { eq, getTableColumns, getTableName, is } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import type { Transaction } from '@/libraries/db/client';
import * as project from '@/libraries/schema/project';
import * as threed from '@/libraries/schema/threed';
import * as multimedia from '@/libraries/schema/multimedia';
import * as traffic from '@/libraries/schema/traffic';

// Derive ownership checks from the App's declared Module tables, not a partial
// hand-maintained list. Auth credentials, preferences and audit history are retained.
const moduleExports: unknown[] = Object.values({ ...project, ...threed, ...multimedia, ...traffic });
export const userContentTables = [...new Set(moduleExports
  .filter((value): value is PgTable => is(value, PgTable)))].flatMap(table => {
    const columns = getTableColumns(table);
    const owner = columns.userId ?? columns.createdBy;
    return owner ? [{ table, owner }] : [];
  });

export async function findUserContent(tx: Transaction, userId: string): Promise<string | null> {
  for (const { table, owner } of userContentTables) {
    const rows = await tx.select({ owner }).from(table).where(eq(owner, userId)).limit(1);
    if (rows.length) return getTableName(table).replaceAll('_', ' ');
  }
  return null;
}
