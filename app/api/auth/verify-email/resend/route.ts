import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createAuthToken, getApplicationUrl } from '@/lib/auth-tokens';
import { authConfigResponse, authRateLimitResponse } from '@/lib/auth-api';
import { dispatchEmailOutbox, queueEmail } from '@/lib/email-outbox';
import { emailVerificationHtml } from '@/lib/email';

const requestSchema = z.object({ email: z.string().trim().email().max(254) });
const GENERIC_RESPONSE = { message: 'If the account needs verification, an email will be sent shortly.' };

export async function POST(request: Request) {
  const configError = authConfigResponse({ jwt: true, outbox: true, applicationUrl: true, emailProvider: true });
  if (configError) return configError;
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  const email = parsed.success ? parsed.data.email.toLowerCase() : undefined;
  const rateLimitError = await authRateLimitResponse(request, 'verify-resend', 3, 60 * 60 * 1000, email);
  if (rateLimitError) return rateLimitError;
  if (!email) return NextResponse.json(GENERIC_RESPONSE);

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && !user.emailVerifiedAt) {
      const token = await createAuthToken(user.id, 'EMAIL_VERIFICATION', 24 * 60 * 60 * 1000);
      const verifyUrl = getApplicationUrl(request.url);
      verifyUrl.pathname = '/api/auth/verify-email';
      verifyUrl.searchParams.set('token', token);
      await queueEmail(user.email, 'Verify your NestLiving email', emailVerificationHtml(user.name ?? 'there', verifyUrl.toString()));
      await dispatchEmailOutbox(1);
    }
  } catch (error) {
    console.error('Verification resend failed:', error instanceof Error ? error.message : 'unknown error');
  }
  return NextResponse.json(GENERIC_RESPONSE);
}