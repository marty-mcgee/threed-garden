import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { learnListQuery } from '@/libraries/services/learn/input';
import { learnFailure, learnResponse } from '@/libraries/services/learn/http';
import { learnGuideService } from '@/libraries/services/learn/service';

export const dynamic = 'force-dynamic';
const service = learnGuideService(db);
export async function GET(request: Request) {
  try {
    const query = learnListQuery(new URL(request.url).searchParams, true);
    const session = await auth();
    return learnResponse({ success: true, ...await service.publicList(query, session?.user?.id) });
  } catch (error) { return learnFailure(error); }
}
