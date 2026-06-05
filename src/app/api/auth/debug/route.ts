import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    // Get all cookies for debugging
    const cookies = request.headers.get('cookie') || '';
    
    return NextResponse.json({
      authenticated: !!session,
      session: session ? {
        user: {
          id: session.user?.id,
          email: session.user?.email,
          name: session.user?.name,
        }
      } : null,
      cookieCount: cookies.split(';').length,
      hasAuthCookie: cookies.includes('better-auth.session'),
      environment: process.env.NODE_ENV,
      url: request.url,
    });
  } catch (error) {
    console.error('Debug auth error:', error);
    return NextResponse.json({ 
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}