import { auth } from '@/libraries/auth';
import { projectMultimediaPreviewQuery } from '@/libraries/services/project/multimedia-preview-contract';
import { readProjectMultimediaPreview, ProjectMultimediaPreviewError } from '@/libraries/services/project/multimedia-preview';

const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(request: Request) {
  let query;
  try {
    query = projectMultimediaPreviewQuery(new URL(request.url).searchParams);
  } catch {
    return Response.json({ error: 'Invalid Project Multimedia request.' }, {
      status: 400,
      headers,
    });
  }
  try {
    const session = await auth();
    return Response.json(await readProjectMultimediaPreview(query, session?.user?.id), { headers });
  } catch (error) {
    const known = error instanceof ProjectMultimediaPreviewError;
    return Response.json({ error: known ? error.message : 'Project Multimedia is unavailable.' }, {
      status: known ? error.status : 500,
      headers,
    });
  }
}
