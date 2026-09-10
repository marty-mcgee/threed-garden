import { getTableColumns, sql } from 'drizzle-orm';
import { threedModels, threedModelFiles } from '@/lib/schema/threed';

// One indexed lookup per selected Model, within the same database query/snapshot.
// Never substitute an unassigned file or a legacy URL for an invalid assignment.
const assigned = sql`f.id = ${threedModels.mainModelFileId}
  and f.model_id = ${threedModels.id}
  and f.user_id = ${threedModels.userId}
  and f.file_type = 'model'`;
export function modelSelection() {
  return {
    ...getTableColumns(threedModels),
    filePath: sql<string>`coalesce((select f.file_path from ${threedModelFiles} f where ${assigned}), '')`.as('resolved_file_path'),
    fileSize: sql<number | null>`(select f.file_size from ${threedModelFiles} f where ${assigned})`.as('resolved_file_size'),
  };
}
export type ResolvedModel = typeof threedModels.$inferSelect & { filePath: string; fileSize: number | null };
