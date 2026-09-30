import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authConfigResponse, authRateLimitResponse } from '@/lib/auth-api';
import {
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export async function POST(request: Request) {
  const configError = authConfigResponse({ jwt: true });
  if (configError) return configError;

  const body = await request.json().catch(() => null);
  const result = loginSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ message: 'Enter a valid email and password.' }, { status: 400 });
  }

  const { password } = result.data;
  const email = result.data.email.trim().toLowerCase();
  const rateLimitError = await authRateLimitResponse(request, 'login', 10, 15 * 60 * 1000, email);
  if (rateLimitError) return rateLimitError;

  let user;
  try {
    user = await prisma.user.findUnique({ where: { email } });
  } catch (error) {
    console.error('Login database request failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ message: 'Login is unavailable. Configure DATABASE_URL and try again.' }, { status: 503 });
  }

  // Deliberately vague error for both "no such user" and "wrong password" —
  // don't leak which one it was, that's an account-enumeration risk.
  if (!user) {
    return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
  }

  const passwordMatches = await verifyPassword(password, user.password);
  if (!passwordMatches) {
    return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
  }
  if (!user.emailVerifiedAt) {
    return NextResponse.json({ message: 'This account is not verified. Use the email verification link to activate it.' }, { status: 403 });
  }

  const token = await createSessionToken({ userId: user.id, role: user.role });
  cookies().set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);

  return NextResponse.json(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    { status: 200 }
  );
}
