import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ notifications: [], unreadCount: 0 });

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.notification.count({ where: { userId: session.userId, isRead: false } }),
  ]);
  return NextResponse.json({ notifications, unreadCount });
}

// Mark all of the signed-in user's notifications as read.
export async function PATCH() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Sign in required.' }, { status: 401 });
  await prisma.notification.updateMany({
    where: { userId: session.userId, isRead: false },
    data: { isRead: true },
  });
  return NextResponse.json({ ok: true });
}