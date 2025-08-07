import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/', 
  '/sign-in',
  '/sign-in(.*)',
  '/sign-up',
  '/sign-up(.*)',
  '/api/clerk-webhook',
  '/api/drive-activity/notification',
  '/api/payment/success',
])

const isIgnoredRoute = createRouteMatcher([
  '/api/auth/callback/discord',
  '/api/auth/callback/notion',
  '/api/auth/callback/slack',
  '/api/flow',
  '/api/cron/wait',
])

export default clerkMiddleware(async (auth, req) => {
  // skip public or ignored paths
  if (isPublicRoute(req) || isIgnoredRoute(req)) {
    return
  }
  // ✅ call `protect()` on the `auth` helper itself
  await auth.protect()
})

export const config = {
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
}
