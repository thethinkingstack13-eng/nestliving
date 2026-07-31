import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { SESSION_COOKIE_NAME } from '@/lib/auth-constants';

export { SESSION_COOKIE_NAME };

// ---------------------------------------------
// Password hashing
// ---------------------------------------------

const SALT_ROUNDS = 10;

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// ---------------------------------------------
// Session (JWT stored in an httpOnly cookie)
// ---------------------------------------------

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Fail loudly in development rather than silently signing tokens
    // with an empty key — that would be a serious security bug.
    throw new Error('JWT_SECRET is not set. Add it to your .env file.');
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  role: 'TENANT' | 'OWNER' | 'ADMIN';
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (typeof payload.userId === 'string' && typeof payload.role === 'string') {
      return { userId: payload.userId, role: payload.role as SessionPayload['role'] };
    }
    return null;
  } catch {
    // Expired, tampered, or malformed token — treat as "not logged in"
    // rather than throwing, so callers can just check for `null`.
    return null;
  }
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE_SECONDS,
};
