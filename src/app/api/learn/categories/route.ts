import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { learnCategoryService } from '@/libraries/services/learn/categories';
import { exactLearnQuery, learnId, learnRevision } from '@/libraries/services/learn/input';
import { learnFailure, learnResponse, learnUnauthorized, readLearnBody, requireLearnOrigin } from '@/libraries/services/learn/http';

export const dynamic = 'force-dynamic';
const service = learnCategoryService(db);

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return learnUnauthorized();
  try {
    exactLearnQuery(new URL(request.url).searchParams, []);
    return learnResponse({ success: true, data: await service.list(session.user.id) });
  } catch (error) { return learnFailure(error, 'Category'); }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return learnUnauthorized();
  try {
    exactLearnQuery(new URL(request.url).searchParams, []);
    return learnResponse({ success: true, data: await service.create(session.user.id, await readLearnBody(request)) }, 201);
  } catch (error) { return learnFailure(error, 'Category'); }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return learnUnauthorized();
  try {
    exactLearnQuery(new URL(request.url).searchParams, []);
    return learnResponse({ success: true, data: await service.update(session.user.id, await readLearnBody(request)) });
  } catch (error) { return learnFailure(error, 'Category'); }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return learnUnauthorized();
  try {
    requireLearnOrigin(request);
    const params = new URL(request.url).searchParams;
    exactLearnQuery(params, ['id', 'revision']);
    const data = await service.remove(session.user.id, learnId(params.get('id'), 'Category'), learnRevision(params.get('revision')));
    return learnResponse({ success: true, data });
  } catch (error) { return learnFailure(error, 'Category'); }
}
