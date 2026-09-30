import { NextResponse } from 'next/server';
import { missingAuthRuntimeConfig } from '@/lib/auth-runtime';
import { checkRateLimit } from '@/lib/rate-limit';

export function authConfigResponse(requirements: Parameters<typeof missingAuthRuntimeConfig>[0]) {
  const missing = missingAuthRuntimeConfig(requirements);
  if (!missing.length) return null;
  return NextResponse.json(
    { message: `Authentication is not configured on this server. Missing: ${missing.join(', ')}.` },
    { status: 503 }
  );
}

export async function authRateLimitResponse(
  request: Request,
  scope: string,
  maximum: number,
  windowMs: number,
  identity?: string
) {
  try {
    const result = await checkRateLimit(request, scope, maximum, windowMs, identity);
    if (result.allowed) return null;
    return NextResponse.json(
      { message: 'Too many attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(result.retryAfterSeconds) } }
    );
  } catch (error) {
    console.error('Authentication rate limiter unavailable:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ message: 'Authentication is temporarily unavailable.' }, { status: 503 });
  }
}