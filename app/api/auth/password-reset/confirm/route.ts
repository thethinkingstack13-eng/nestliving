import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword } from '@/lib/auth';
import { hashAuthToken } from '@/lib/auth-tokens';
import { authConfigResponse, authRateLimitResponse } from '@/lib/auth-api';
import { prisma } from '@/lib/prisma';

const confirmSchema = z.object({ token: z.string().min(20).max(200), password: z.string().min(8).max(128) });

export async function POST(request: Request) {
  const configError = authConfigResponse({ jwt: true });
  if (configError) return configError;
  const rateLimitError = await authRateLimitResponse(request, 'password-reset-confirm', 10, 15 * 60 * 1000);
  if (rateLimitError) return rateLimitError;
  const body = await request.json().catch(() => null);
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: 'Enter a valid reset link and password.' }, { status: 400 });

  const now = new Date();
  const tokenHash = hashAuthToken(parsed.data.token);
  const passwordHash = await hashPassword(parsed.data.password);
  try {
    await prisma.$transaction(async (transaction) => {
      const authToken = await transaction.authToken.findFirst({
        where: { tokenHash, purpose: 'PASSWORD_RESET', usedAt: null, expiresAt: { gt: now } },
        select: { id: true, userId: true },
      });
      if (!authToken) throw new Error('RESET_TOKEN_INVALID');
      const consumed = await transaction.authToken.updateMany({
        where: { id: authToken.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (consumed.count !== 1) throw new Error('RESET_TOKEN_INVALID');
      await transaction.user.update({ where: { id: authToken.userId }, data: { password: passwordHash } });
      await transaction.authToken.updateMany({
        where: { userId: authToken.userId, purpose: 'PASSWORD_RESET', usedAt: null },
        data: { usedAt: now },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'RESET_TOKEN_INVALID') {
      return NextResponse.json({ message: 'This reset link is invalid or expired. Request a new one.' }, { status: 400 });
    }
    console.error('Password reset confirmation failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ message: 'Password recovery is temporarily unavailable.' }, { status: 503 });
  }
  return NextResponse.json({ message: 'Password updated. You can now sign in.' });
}