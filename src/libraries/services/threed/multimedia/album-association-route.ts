import { auth } from '@/libraries/auth';
import { ZodError } from 'zod';
import { readEntityAlbums, saveEntityAlbums } from './album-associations';
import { parseAlbumEntityId, AlbumAssociationError, type AlbumEntityKind } from './album-association-contract';

type Context = { params: Promise<{ id: string }> };
const headers = { 'Cache-Control': 'private, no-store' };

export function createAlbumAssociationHandlers(kind: AlbumEntityKind) {
  async function handle(request: Request, context: Context, write: boolean) {
    const session = await auth();
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
    try {
      const { id } = await context.params;
      const entityId = parseAlbumEntityId(kind, id);
      if (write) {
        const origin = request.headers.get('origin');
        if (origin && origin !== new URL(request.url).origin) return Response.json({ error: 'Invalid origin' }, { status: 403, headers });
        const text = await request.text();
        if (new TextEncoder().encode(text).length > 16_384) return Response.json({ error: 'Request too large' }, { status: 413, headers });
        const result = await saveEntityAlbums(session.user.id, kind, entityId, JSON.parse(text));
        return Response.json(result, { headers });
      }
      return Response.json(await readEntityAlbums(session.user.id, kind, entityId), { headers });
    } catch (error) {
      if (error instanceof AlbumAssociationError) return Response.json({ error: error.message }, { status: error.status, headers });
      if (error instanceof ZodError || error instanceof SyntaxError) return Response.json({ error: 'Invalid Album assignments' }, { status: 400, headers });
      return Response.json({ error: 'Unable to access Album assignments' }, { status: 500, headers });
    }
  }
  return {
    GET: (request: Request, context: Context) => handle(request, context, false),
    PUT: (request: Request, context: Context) => handle(request, context, true),
  };
}
