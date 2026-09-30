import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createAuthToken, getApplicationUrl } from '@/lib/auth-tokens';
import { authConfigResponse, authRateLimitResponse } from '@/lib/auth-api';
import { dispatchEmailOutbox, queueEmail } from '@/lib/email-outbox';
import { passwordResetHtml } from '@/lib/email';

const requestSchema = z.object({ email: z.string().trim().email().max(254) });
const GENERIC_RESPONSE = { message: 'If an account exists for that email, reset instructions will be sent.' };

export async function POST(request: Request) {
  const configError = authConfigResponse({ jwt: true, outbox: true, applicationUrl: true, emailProvider: true });
  if (configError) return configError;
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  const email = parsed.success ? parsed.data.email.toLowerCase() : undefined;
  const rateLimitError = await authRateLimitResponse(request, 'password-reset', 5, 60 * 60 * 1000, email);
  if (rateLimitError) return rateLimitError;
  if (!email) return NextResponse.json(GENERIC_RESPONSE);

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user?.emailVerifiedAt) {
      const token = await createAuthToken(user.id, 'PASSWORD_RESET', 30 * 60 * 1000);
      const resetUrl = getApplicationUrl(request.url);
      resetUrl.pathname = '/auth/password-reset';
      resetUrl.searchParams.set('token', token);
      await queueEmail(user.email, 'Reset your NestLiving password', passwordResetHtml(resetUrl.toString()));
      await dispatchEmailOutbox(1);
    }
  } catch (error) {
    console.error('Password reset request failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ message: 'Password recovery is temporarily unavailable.' }, { status: 503 });
  }
  return NextResponse.json(GENERIC_RESPONSE);
}