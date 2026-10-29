import { albumEntityKind } from '@/libraries/services/threed/multimedia/album-association-contract';
import { createAlbumAssociationHandlers } from '@/libraries/services/threed/multimedia/album-association-route';

type Context = { params: Promise<{ moduleType: string; id: string }> };
async function handle(request: Request, context: Context, method: 'GET' | 'PUT') {
  const params = await context.params;
  const kind = albumEntityKind.safeParse(params.moduleType);
  if (!kind.success) return Response.json({ error: 'Unknown ThreeD Sub-Module' }, { status: 400 });
  return createAlbumAssociationHandlers(kind.data)[method](request, { params: Promise.resolve(params) });
}
export const GET = (request: Request, context: Context) => handle(request, context, 'GET');
export const PUT = (request: Request, context: Context) => handle(request, context, 'PUT');
