import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { dispatchEmailOutbox } from '@/lib/email-outbox';

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization') ?? '';
  const expected = secret ? `Bearer ${secret}` : '';
  const suppliedBuffer = Buffer.from(authorization);
  const expectedBuffer = Buffer.from(expected);
  if (!secret || suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) {
    return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
  }

  const result = await dispatchEmailOutbox(50);
  return NextResponse.json(result);
}

export const GET = run;
export const POST = run;