import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { exactLearnQuery, learnImportSchema } from '@/libraries/services/learn/input';
import { learnFailure, learnResponse, learnUnauthorized, readLearnBody } from '@/libraries/services/learn/http';
import { learnGuideService } from '@/libraries/services/learn/service';

export const dynamic = 'force-dynamic';
const service = learnGuideService(db);
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return learnUnauthorized();
  try {
    exactLearnQuery(new URL(request.url).searchParams, []);
    learnImportSchema.parse(await readLearnBody(request));
    return learnResponse({ success: true, data: await service.importStarters(session.user.id) });
  } catch (error) { return learnFailure(error); }
}
