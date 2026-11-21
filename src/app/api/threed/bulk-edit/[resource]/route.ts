import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { isCatalogBulkResource } from '@/libraries/services/threed/bulk-edit/fields';
import { CatalogBulkError, parseBulkRequest, parseBulkScope } from '@/libraries/services/threed/bulk-edit/contract';
import { updateCatalogRecords } from '@/libraries/services/threed/bulk-edit/catalog';
import { updateBulkModelFiles } from '@/libraries/services/threed/bulk-edit/model-files';
import { updateBulkDefinitions } from '@/libraries/services/threed/bulk-edit/definitions';
import { renameBulkAnimationCategories } from '@/libraries/services/threed/bulk-edit/animation-categories';

export async function PATCH(request: NextRequest, context: { params: Promise<{ resource: string }> }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new CatalogBulkError('Unauthorized', 401);
    const origin = request.headers.get('origin');
    if (origin && origin !== request.nextUrl.origin) throw new CatalogBulkError('Invalid request origin.', 403);
    const { resource } = await context.params;
    if (!isCatalogBulkResource(resource)) throw new CatalogBulkError('Unknown editable catalog.', 404);
    const scope = parseBulkScope(resource, request.nextUrl.searchParams);
    const text = await request.text();
    if (Buffer.byteLength(text, 'utf8') > 256 * 1024) throw new CatalogBulkError('Selection is too large.');
    let input: unknown;
    try { input = JSON.parse(text); } catch { throw new CatalogBulkError('Invalid Bulk Edit request.'); }
    const { selection, changes, names } = parseBulkRequest(resource, input);
    const updated = await db.transaction(async tx => {
      if (resource === 'model-files') return updateBulkModelFiles(tx, userId, selection, changes, scope);
      if (resource === 'scenarios' || resource === 'simulations') return updateBulkDefinitions(tx, userId, resource, selection, changes, scope);
      if (resource === 'animation-categories') return renameBulkAnimationCategories(tx, userId, selection, names);
      return updateCatalogRecords(tx, userId, resource, selection, changes);
    });
    return NextResponse.json({ success: true, data: { updated } });
  } catch (error) {
    const failure = error instanceof CatalogBulkError ? error : new CatalogBulkError('Could not save the selected records.', 500);
    return NextResponse.json({ success: false, error: failure.message }, { status: failure.status });
  }
}
