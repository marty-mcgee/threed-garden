import { getTableColumns, sql } from 'drizzle-orm';
import { threedModels, threedModelFiles } from '@/libraries/schema/threed';

// One indexed lookup per selected Model, within the same database query/snapshot.
// Never substitute an unassigned file or a legacy URL for an invalid assignment.
const assigned = sql`f.id = ${threedModels.mainModelFileId}
  and f.model_id = ${threedModels.id}
  and f.user_id = ${threedModels.userId}
  and f.file_type = 'model'`;
export function modelSelection() {
  return {
    ...getTableColumns(threedModels),
    // Optional additive feature: old databases must still load Projects before its migration.
    // Whole-row JSON lookup returns NULL for a missing key without referencing a missing column.
    imageTopViewUrl: sql<string | null>`to_jsonb(${threedModels}) ->> 'image_top_view_url'`.as('resolved_top_view_url'),
    filePath: sql<string>`coalesce((select f.file_path from ${threedModelFiles} f where ${assigned}), '')`.as('resolved_file_path'),
    fileSize: sql<number | null>`(select f.file_size from ${threedModelFiles} f where ${assigned})`.as('resolved_file_size'),
  };
}
export type ResolvedModel = typeof threedModels.$inferSelect & { filePath: string; fileSize: number | null };
