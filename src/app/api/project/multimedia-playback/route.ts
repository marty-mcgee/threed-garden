import { auth } from '@/libraries/auth';
import { sceneMultimediaQuery } from '@/libraries/services/threed/multimedia/scene-multimedia-contract';
import { readSceneMultimedia, SceneMultimediaReadError } from '@/libraries/services/threed/multimedia/scene-multimedia-read';

const headers = { 'Cache-Control': 'private, no-store' };

export async function GET(request: Request) {
  let query;
  try {
    query = sceneMultimediaQuery(new URL(request.url).searchParams);
  } catch {
    return Response.json({ error: 'Invalid Project Multimedia request.' }, {
      status: 400,
      headers
    });
  }
  try {
    const session = await auth();
    return Response.json(await readSceneMultimedia(query, session?.user?.id), { headers });
  } catch (error) {
    const known = error instanceof SceneMultimediaReadError;
    return Response.json({ error: known ? error.message : 'Project Multimedia is unavailable.' }, {
      status: known ? error.status : 500,
      headers
    });
  }
}
