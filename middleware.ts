import { auth } from "@/lib/auth/server";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Get the pathname
  const pathname = request.nextUrl.pathname;
  
  // Get session
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: request.headers,
    });
  } catch (error) {
    console.error("Middleware auth error:", error);
  }
  
  const isAuthPage = pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");
  const isApiRoute = pathname.startsWith("/api");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  
  console.log("Middleware:", { 
    pathname, 
    isAuthenticated: !!session,
    isDashboardRoute,
    isApiRoute,
    isAuthPage
  });
  
  // Allow auth pages and API routes (API routes handle their own auth)
  if (isAuthPage || isApiRoute) {
    return NextResponse.next();
  }
  
  // Protect dashboard routes
  if (isDashboardRoute && !session) {
    const signInUrl = new URL("/sign-in", request.url);
    return NextResponse.redirect(signInUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};