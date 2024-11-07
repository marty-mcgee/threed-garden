

// ** NEXT AUTH
export { auth as middleware } from '#/lib/auth/auth'

// ** CLERK AUTH
// To learn more how to use clerkMiddleware to protect pages in your app, 
// check out https://clerk.com/docs/references/nextjs/clerk-middleware
import { 
  clerkMiddleware, 
  createRouteMatcher,
} from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/(.*)',
  '/contact(.*)',
  '/sign-in(.*)', 
  '/sign-up(.*)',
])

export default clerkMiddleware(
  async (auth, request) => {
    if (!isPublicRoute(request)) {
      await auth.protect()
    }
  },
  { 
    debug: false,
  },
)

// ** middleware config
// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: [
    // ** NEXT AUTH
    // Skip for images + favicon.ico
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  
    // ** CLERK AUTH
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    ],
}
