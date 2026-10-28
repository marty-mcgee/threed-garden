import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { exactLearnQuery, learnId, learnListQuery, learnRevision } from '@/libraries/services/learn/input';
import { learnFailure, learnResponse, learnUnauthorized, readLearnBody, requireLearnOrigin } from '@/libraries/services/learn/http';
import { learnGuideService } from '@/libraries/services/learn/service';

export const dynamic = 'force-dynamic';
const service = learnGuideService(db);
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return learnUnauthorized();
  try {
    const params = new URL(request.url).searchParams;
    if (params.has('id')) {
      exactLearnQuery(params, ['id']);
      return learnResponse({ success: true, data: await service.get(session.user.id, learnId(params.get('id'))) });
    }
    return learnResponse({ success: true, ...await service.list(session.user.id, learnListQuery(params)) });
  } catch (error) { return learnFailure(error); }
}
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return learnUnauthorized();
  try {
    exactLearnQuery(new URL(request.url).searchParams, []);
    return learnResponse({ success: true, data: await service.create(session.user.id, await readLearnBody(request)) }, 201);
  } catch (error) { return learnFailure(error); }
}
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return learnUnauthorized();
  try {
    exactLearnQuery(new URL(request.url).searchParams, []);
    return learnResponse({ success: true, data: await service.update(session.user.id, await readLearnBody(request)) });
  } catch (error) { return learnFailure(error); }
}
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return learnUnauthorized();
  try {
    requireLearnOrigin(request);
    const params = new URL(request.url).searchParams;
    exactLearnQuery(params, ['id', 'revision']);
    return learnResponse({ success: true, data: await service.remove(session.user.id, learnId(params.get('id')), learnRevision(params.get('revision'))) });
  } catch (error) { return learnFailure(error); }
}
