import { NextResponse } from 'next/server';

import {
  AUTH_COOKIE_NAME,
  createSessionCookieValue,
  parseSessionCookieValue,
} from '@/lib/auth-session';
import { AUTH_BYPASS, DEV_SESSION } from '@/lib/dev-auth';
import { updateSession } from '@/utils/supabase/middleware';

import type { DemoRole } from '@/types/operations';
import type { NextRequest } from 'next/server';

// Paths that require a verified session. `/automobiles` is intentionally absent:
// station accounts authenticate client-side only and have no server session yet.
const SESSION_REQUIRED_PREFIXES = ['/admin', '/audit', '/reports', '/bookings', '/settings'];

// Reachable without a session (public signup, auth screens).
const PUBLIC_PATHS = ['/admin/signup', '/spaces/auth', '/automobiles/auth'];

const matchesPrefix = (path: string, prefixes: string[]) =>
  prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

const readSession = (cookieValue: string | undefined) =>
  cookieValue ? parseSessionCookieValue(cookieValue) : null;

const readRole = (cookieValue: string | undefined): DemoRole | null => {
  const parsed = readSession(cookieValue);
  if (!parsed) return null;

  if (parsed.role === 'ADMIN' || parsed.role === 'MINISTRY' || parsed.role === 'FIELD_OFFICER') {
    return parsed.role;
  }

  return null;
};

const isForbiddenForRole = (path: string, role: DemoRole): boolean => {
  const isReportsPath = path === '/automobiles/reports' || path.startsWith('/automobiles/reports/');
  const isIdlePath = path === '/automobiles/idle' || path.startsWith('/automobiles/idle/');

  if (role === 'FIELD_OFFICER' && (isReportsPath || isIdlePath)) {
    return true;
  }

  return false;
};

export async function middleware(request: NextRequest) {
  // Refresh the Supabase auth cookies on every matched request.
  const supabaseResponse = await updateSession(request);

  const finalize = (response: NextResponse) => {
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    return response;
  };

  const { pathname } = request.nextUrl;
  const cookieValue = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // Local dev: serve every protected route as an admin, seeding the session cookie
  // so anything that reads it (e.g. /api/auth/me) sees a real session.
  if (AUTH_BYPASS) {
    const response = NextResponse.next();
    if (!cookieValue) {
      response.cookies.set(AUTH_COOKIE_NAME, createSessionCookieValue(DEV_SESSION), { path: '/' });
    }
    return finalize(response);
  }

  const role = readRole(cookieValue);
  const session = readSession(cookieValue);
  const hasSpacesAuthSession = Boolean(session?.uid && session?.openSpaceName);

  const isSpacesAuthPath = pathname === '/spaces/auth';
  const isSpacesPath = pathname === '/spaces' || pathname.startsWith('/spaces/');

  if (isSpacesPath && !isSpacesAuthPath && !hasSpacesAuthSession) {
    return finalize(NextResponse.redirect(new URL('/spaces/auth', request.url)));
  }

  if (
    matchesPrefix(pathname, SESSION_REQUIRED_PREFIXES) &&
    !matchesPrefix(pathname, PUBLIC_PATHS)
  ) {
    if (!role) {
      return finalize(NextResponse.redirect(new URL('/spaces/auth', request.url)));
    }
  }

  if (role && isForbiddenForRole(pathname, role)) {
    return finalize(NextResponse.redirect(new URL('/automobiles', request.url)));
  }

  return supabaseResponse;
}

export const config = {
  // Sessions are signed with node:crypto, so this runs on the Node.js runtime
  // (stable for middleware since Next 15.5).
  runtime: 'nodejs',
  matcher: [
    '/admin/:path*',
    '/admin',
    '/automobiles/:path*',
    '/spaces/auth',
    '/spaces/:path*',
    '/bookings/:path*',
    '/reports/:path*',
    '/audit/:path*',
    '/settings/:path*',
  ],
};
