import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/libraries/auth';
import { db } from '@/libraries/db/client';
import { InputValidationError } from '@/libraries/utils/input-validation';
import { AssemblyContractError } from '@/libraries/services/threed/models/assembly-group-core';
import { AssemblyProjectPlacementError, placeAssemblyInProject } from '@/libraries/services/threed/models/assembly-project-placement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const headers = {
    'Cache-Control': 'private, no-store',
  };
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({
      success: false,
      error: 'Unauthorized',
    }, {
      status: 401,
      headers,
    });
    const text = await request.text();
    if (Buffer.byteLength(text, 'utf8') > 8192) {
      return NextResponse.json({
        success: false,
        error: 'Assembly placement request is too large.',
      }, {
        status: 413,
        headers,
      });
    }
    let input: unknown;
    try {
      input = JSON.parse(text);
    } catch {
      throw new InputValidationError('Invalid Assembly placement request.');
    }
    const data = await placeAssemblyInProject(db, session.user.id, input);
    return NextResponse.json({
      success: true,
      data,
    }, {
      status: data.replayed ? 200 : 201,
      headers,
    });
  } catch (error) {
    if (error instanceof AssemblyProjectPlacementError || error instanceof AssemblyContractError || error instanceof InputValidationError) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, {
        status: error instanceof AssemblyProjectPlacementError ? error.status : 400,
        headers,
      });
    }
    // Drizzle wraps provider errors in cause. Record only a bounded SQLSTATE,
    // never the SQL, parameters, connection details or uploaded asset URLs.
    let cause: unknown = error;
    let databaseCode = 'UNKNOWN';
    for (let depth = 0; depth < 5 && cause && typeof cause === 'object'; depth++) {
      const detail = cause as { code?: unknown; cause?: unknown };
      if (typeof detail.code === 'string' && /^[0-9A-Z]{5}$/.test(detail.code)) {
        databaseCode = detail.code;
        break;
      }
      cause = detail.cause;
    }
    console.error('Assembly placement failed', { databaseCode });
    // No database/provider details or request contents are exposed to the client.
    return NextResponse.json({
      success: false,
      error: 'Could not place the Assembly. Keep this placement open and retry.',
    }, {
      status: 500,
      headers,
    });
  }
}
