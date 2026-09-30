import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import type { AuthTokenPurpose } from '@prisma/client';

export async function createAuthToken(userId: string, purpose: AuthTokenPurpose, lifetimeMs: number) {
  await prisma.authToken.deleteMany({
    where: { userId, expiresAt: { lt: new Date() } },
  });
  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await prisma.authToken.create({
    data: { userId, purpose, tokenHash, expiresAt: new Date(Date.now() + lifetimeMs) },
  });
  return token;
}

export function hashAuthToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function getApplicationUrl(requestUrl: string): URL {
  const configured = process.env.APP_URL;
  if (configured) return new URL(configured);
  if (process.env.NODE_ENV === 'production') throw new Error('APP_URL must be configured in production.');
  return new URL(new URL(requestUrl).origin || 'http://localhost:3000');
}