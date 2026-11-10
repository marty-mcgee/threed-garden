import { NextResponse, type NextRequest } from 'next/server';

/** Forward only the router's pathname; never trust a caller-supplied path or host. */
export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-threed-page-path', request.nextUrl.pathname);
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!api|_next|assets|favicon|robots.txt|llms.txt|.*\\.[^/]+$).*)'],
};
