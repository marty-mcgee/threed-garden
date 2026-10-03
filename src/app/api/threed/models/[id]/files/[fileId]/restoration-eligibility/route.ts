import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';
import { diagnoseModelFileRestoration } from '@/libraries/services/threed/models/model-file-restoration-eligibility';
import { EligibilityInspectionError } from '@/libraries/services/threed/models/model-file-restoration-eligibility-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
const errorResponse = (status: number, error: string, code: string) => NextResponse.json(
  { success: false, restoreAllowed: false, candidateValidation: 'not_performed', error, code }, { status, headers },
);

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; fileId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse(401, 'Unauthorized', 'UNAUTHORIZED');
    const { id, fileId: rawFileId } = await params;
    const modelId = /^[1-9]\d*$/.test(id) ? Number(id) : NaN;
    const fileId = /^[1-9]\d*$/.test(rawFileId) ? Number(rawFileId) : NaN;
    if (![modelId, fileId].every(Number.isSafeInteger) || request.nextUrl.searchParams.size > 0 || request.body != null) {
      return errorResponse(400, 'Invalid Model/File inspection request', 'INVALID_REQUEST');
    }
    const data = await diagnoseModelFileRestoration({ userId: session.user.id, modelId, fileId });
    if (!data) return errorResponse(404, 'Model or File not found', 'OWNED_CONTEXT_UNAVAILABLE');
    return NextResponse.json({ success: true, restoreAllowed: false, data }, { headers });
  } catch (error) {
    if (error instanceof EligibilityInspectionError) {
      return errorResponse(error.code === 'SNAPSHOT_TIMEOUT' || error.code === 'INSPECTION_TIMEOUT' ? 504 : 503, error.message, error.code);
    }
    return errorResponse(503, 'Read-only restoration inspection is unavailable', 'INSPECTION_UNAVAILABLE');
  }
}
