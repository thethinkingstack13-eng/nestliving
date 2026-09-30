import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validations';
import { hashPassword } from '@/lib/auth';
import { createAuthToken, getApplicationUrl } from '@/lib/auth-tokens';
import { authConfigResponse, authRateLimitResponse } from '@/lib/auth-api';
import { dispatchEmailOutbox, queueEmail } from '@/lib/email-outbox';
import { emailVerificationHtml } from '@/lib/email';

export async function POST(request: Request) {
  const configError = authConfigResponse({ jwt: true, outbox: true, applicationUrl: true, emailProvider: true });
  if (configError) return configError;
  const rateLimitError = await authRateLimitResponse(request, 'register', 5, 60 * 60 * 1000);
  if (rateLimitError) return rateLimitError;

  const body = await request.json().catch(() => null);
  const result = registerSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0]?.message ?? 'Invalid input.' },
      { status: 400 }
    );
  }

  const { fullName, password, role } = result.data;
  const email = result.data.email.trim().toLowerCase();
  const emailRateLimitError = await authRateLimitResponse(request, 'register-email', 3, 60 * 60 * 1000, email);
  if (emailRateLimitError) return emailRateLimitError;

  try {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({ data: { email, password: passwordHash, name: fullName, role } });
    const token = await createAuthToken(user.id, 'EMAIL_VERIFICATION', 24 * 60 * 60 * 1000);
    const verifyUrl = getApplicationUrl(request.url);
    verifyUrl.pathname = '/api/auth/verify-email';
    verifyUrl.searchParams.set('token', token);
    await queueEmail(
      user.email,
      'Verify your NestLiving email',
      emailVerificationHtml(user.name ?? 'there', verifyUrl.toString())
    );
    await dispatchEmailOutbox(1);

    return NextResponse.json({ message: 'If registration is available for this address, a verification email will be sent.' }, { status: 202 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: 'If registration is available for this address, a verification email will be sent.' }, { status: 202 });
    }
    console.error('Registration failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ message: 'Registration is temporarily unavailable. Check server configuration and try again.' }, { status: 503 });
  }
}
