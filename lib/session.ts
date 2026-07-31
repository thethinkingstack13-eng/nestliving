import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, verifySessionToken, type SessionPayload } from '@/lib/auth';

/**
 * Reads and verifies the session cookie inside a Server Component,
 * Route Handler, or Server Action. Returns `null` if the person isn't
 * logged in or the token is invalid/expired.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
