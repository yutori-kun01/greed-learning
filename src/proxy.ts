import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic routing only.
 *
 * This used to `fetch('/api/auth/get-session')` on every single request — a
 * second round trip through the Worker, on top of the session lookup the
 * layout then did anyway, for every page and every asset the matcher covered.
 * The Next.js docs are explicit that proxy is not the place for session
 * management or authorization.
 *
 * So this only looks at whether a session cookie exists, to keep signed-out
 * visitors off member pages and signed-in ones off the login form. Every
 * real decision — is the session valid, is the account suspended, is the user
 * an admin — is made by the member/admin layouts and by requireUser /
 * requireAdmin in the server actions, which cannot be bypassed by forging a
 * cookie.
 */

const PROTECTED_PREFIXES = ['/dashboard', '/learning', '/bookmarks', '/admin', '/settings', '/resources', '/courses'];

function hasSessionCookie(request: NextRequest): boolean {
  // Better Auth prefixes the cookie with __Secure- when served over HTTPS.
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.includes('better-auth.session_token') && cookie.value.length > 0);
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const signedIn = hasSessionCookie(request);

  if (!signedIn && PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }

  if (signedIn && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
