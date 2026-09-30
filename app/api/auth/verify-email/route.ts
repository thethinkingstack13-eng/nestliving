import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashAuthToken } from '@/lib/auth-tokens';
import { authConfigResponse } from '@/lib/auth-api';

export async function GET(request: Request) {
  const configError = authConfigResponse({});
  if (configError) return configError;

  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const loginUrl = new URL('/auth/verify-email', url);
  if (!token || token.length > 200) {
    loginUrl.searchParams.set('verified', 'invalid');
    return NextResponse.redirect(loginUrl);
  }

  const now = new Date();
  try {
    const authToken = await prisma.authToken.findFirst({
      where: {
        tokenHash: hashAuthToken(token),
        purpose: 'EMAIL_VERIFICATION',
        usedAt: null,
        expiresAt: { gt: now },
      },
      select: { id: true, userId: true },
    });
    if (!authToken) {
      loginUrl.searchParams.set('verified', 'invalid');
      return NextResponse.redirect(loginUrl);
    }

    await prisma.$transaction(async (transaction) => {
      const consumed = await transaction.authToken.updateMany({
        where: { id: authToken.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (consumed.count !== 1) throw new Error('TOKEN_ALREADY_USED');
      await transaction.user.update({ where: { id: authToken.userId }, data: { emailVerifiedAt: now } });
      await transaction.authToken.updateMany({
        where: { userId: authToken.userId, purpose: 'EMAIL_VERIFICATION', usedAt: null },
        data: { usedAt: now },
      });
    });
    loginUrl.searchParams.set('verified', 'success');
  } catch (error) {
    if (error instanceof Error && error.message === 'TOKEN_ALREADY_USED') {
      loginUrl.searchParams.set('verified', 'invalid');
    } else {
      console.error('Email verification failed:', error instanceof Error ? error.message : 'unknown error');
      return NextResponse.json({ message: 'Email verification is temporarily unavailable.' }, { status: 503 });
    }
  }
  return NextResponse.redirect(loginUrl);
}