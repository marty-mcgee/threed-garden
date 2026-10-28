import { db } from '@/libraries/db/client';
import { learnListQuery } from '@/libraries/services/learn/input';
import { learnFailure, learnResponse } from '@/libraries/services/learn/http';
import { learnGuideService } from '@/libraries/services/learn/service';

export const dynamic = 'force-dynamic';
const service = learnGuideService(db);
export async function GET(request: Request) {
  try { return learnResponse({ success: true, ...await service.publicList(learnListQuery(new URL(request.url).searchParams, true)) }); }
  catch (error) { return learnFailure(error); }
}
