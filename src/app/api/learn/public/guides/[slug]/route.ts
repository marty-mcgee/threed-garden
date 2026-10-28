import { db } from '@/libraries/db/client';
import { exactLearnQuery } from '@/libraries/services/learn/input';
import { learnFailure, learnResponse } from '@/libraries/services/learn/http';
import { learnGuideService } from '@/libraries/services/learn/service';

export const dynamic = 'force-dynamic';
const service = learnGuideService(db);
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    exactLearnQuery(new URL(request.url).searchParams, []);
    return learnResponse({ success: true, data: await service.publicGet((await params).slug) });
  } catch (error) { return learnFailure(error); }
}
