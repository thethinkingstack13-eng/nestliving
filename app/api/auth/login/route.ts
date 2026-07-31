import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = loginSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json({ message: 'Enter a valid email and password.' }, { status: 400 });
  }

  const { email, password } = result.data;

  const user = await prisma.user.findUnique({ where: { email } });

  // Deliberately vague error for both "no such user" and "wrong password" —
  // don't leak which one it was, that's an account-enumeration risk.
  if (!user) {
    return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
  }

  const passwordMatches = await verifyPassword(password, user.password);
  if (!passwordMatches) {
    return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
  }

  const token = await createSessionToken({ userId: user.id, role: user.role });
  cookies().set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);

  return NextResponse.json(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    { status: 200 }
  );
}
