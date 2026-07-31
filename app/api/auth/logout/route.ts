import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  cookies().delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ message: 'Logged out.' }, { status: 200 });
}
