export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    // Get all cookies from the request
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies: Record<string, string> = {};
    cookieHeader.split(';').forEach(cookie => {
      const [key, ...rest] = cookie.trim().split('=');
      if (key) cookies[key] = rest.join('=');
    });
    
    // Try to get session
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    return NextResponse.json({
      hasSession: !!session,
      sessionUser: session?.user ? {
        id: session.user.id,
        email: session.user.email,
      } : null,
      hasAuthCookie: !!cookies['better-auth.session_token'],
      allCookies: Object.keys(cookies),
      environment: process.env.NODE_ENV,
      baseURL: process.env.NEXTAUTH_URL,
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ 
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}