import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { changePasswordSchema } from '@/lib/validations';
import { hashPassword, verifyPassword } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'You must be logged in.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const result = changePasswordSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0]?.message ?? 'Invalid input.' },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword } = result.data;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ message: 'Account not found.' }, { status: 404 });
  }

  const currentMatches = await verifyPassword(currentPassword, user.password);
  if (!currentMatches) {
    return NextResponse.json({ message: 'Current password is incorrect.' }, { status: 401 });
  }

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: session.userId },
    data: { password: newHash },
  });

  return NextResponse.json({ message: 'Password updated.' }, { status: 200 });
}
