import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AnimationLibraryError } from './contracts';

// Never return query text, connection details, or storage credentials to callers.
export async function animationResponse(operation: (userId: string) => Promise<unknown>) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ success: true, ...await operation(session.user.id) as object });
  } catch (error) {
    if (error instanceof AnimationLibraryError) return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    let cause: unknown = error;
    for (let depth = 0; depth < 5 && cause && typeof cause === 'object'; depth++) {
      const current = cause as { code?: string; cause?: unknown };
      if (current.code === '42P01' || current.code === '42703') {
        return NextResponse.json({
          success: false,
          code: 'ANIMATION_SCHEMA_NOT_READY',
          error: 'Animations Library database setup is incomplete. Apply the approved Animations schema to this environment, then refresh.',
        }, { status: 503 });
      }
      if (current.code === '23503' || current.code === '23505') {
        return NextResponse.json({ success: false, error: 'Animation reference conflict. Refresh and try again.' }, { status: 409 });
      }
      cause = current.cause;
    }
    return NextResponse.json({ success: false, error: 'Unable to access the Animations Library. Please retry.' }, { status: 500 });
  }
}
