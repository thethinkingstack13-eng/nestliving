import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { SESSION_COOKIE_NAME } from '@/lib/auth-constants';

// Routes that require a logged-in session. Anything under these paths
// redirects to /auth/login (with a `from` param) if there's no valid
// session cookie.
const PROTECTED_PREFIXES = ['/dashboard', '/onboarding', '/profile', '/settings'];

const ROLE_REQUIRED_PATHS = [
  { prefix: '/dashboard/admin', role: 'ADMIN' },
  { prefix: '/dashboard/owner', role: 'OWNER' },
  { prefix: '/dashboard/tenant', role: 'TENANT' },
  { prefix: '/onboarding/owner', role: 'OWNER' },
  { prefix: '/onboarding/tenant', role: 'TENANT' },
] as const;

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return redirectToLogin(request);
  }

  try {
    // Edge middleware can't import lib/auth's Node-only bits, so the
    // secret + verification are inlined here using the same `jose`
    // library (which is edge-compatible).
    const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? '');
    const { payload } = await jwtVerify(token, secret);
    const requiredRole = ROLE_REQUIRED_PATHS.find(({ prefix }) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`)
    )?.role;

    if (requiredRole && payload.role !== requiredRole) {
      return redirectToRoleHome(request, payload.role);
    }

    return NextResponse.next();
  } catch {
    return redirectToLogin(request);
  }
}

function redirectToRoleHome(request: NextRequest, role: unknown) {
  const destinations: Record<string, string> = {
    TENANT: '/dashboard/tenant',
    OWNER: '/dashboard/owner',
    ADMIN: '/dashboard/admin',
  };
  const destination = typeof role === 'string' ? destinations[role] : undefined;
  return NextResponse.redirect(new URL(destination ?? '/auth/login', request.url));
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/auth/login', request.url);
  loginUrl.searchParams.set('from', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/profile/:path*', '/settings/:path*'],
};
