import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

import { unauthorized } from "@/lib/api-response";

/**
 * Public routes are derived from the Clerk sign-in / sign-up env vars so the
 * proxy and Clerk's own redirects can never disagree about where auth lives.
 */
const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in";
const signUpUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/sign-up";

const isPublicRoute = createRouteMatcher([`${signInUrl}/:path*`, `${signUpUrl}/:path*`]);
const isApiRoute = createRouteMatcher(["/api/:path*"]);

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) {
    return;
  }

  // `auth.protect()` answers a non-document request with a 404, which tells an
  // API client nothing about why it failed. API routes get the 401 their
  // callers expect instead; deny-by-default still holds, and the handlers
  // re-check `auth()` because they need the user ID regardless.
  if (isApiRoute(request)) {
    const { userId } = await auth();

    return userId ? undefined : unauthorized();
  }

  await auth.protect();
});

export const config = {
  matcher: [
    // Everything except Next internals and static assets.
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
  ],
};
