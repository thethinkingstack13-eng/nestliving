import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validations';
import {
  hashPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from '@/lib/auth';
import { sendEmail, welcomeEmailHtml } from '@/lib/email';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = registerSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0]?.message ?? 'Invalid input.' },
      { status: 400 }
    );
  }

  const { fullName, email, password, role } = result.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json(
      { message: 'An account with this email already exists.' },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      name: fullName,
      role,
    },
  });

  const token = await createSessionToken({ userId: user.id, role: user.role });
  cookies().set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);

  // Welcome email is transactional (not a preference toggle) -- it
  // always fires once, regardless of the user's notification settings.
  // Don't block the response on it; fire-and-forget is fine here.
  void sendEmail({
    to: user.email,
    subject: 'Welcome to NestLiving',
    html: welcomeEmailHtml(user.name ?? 'there'),
  });

  return NextResponse.json(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    { status: 201 }
  );
}
