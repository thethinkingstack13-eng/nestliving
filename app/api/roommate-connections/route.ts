import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { authRateLimitResponse } from '@/lib/auth-api';
import { createNotification } from '@/lib/notifications';

const requestSchema = z.object({ targetUserId: z.string().regex(/^[a-f\d]{24}$/i) });

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Sign in to connect with roommates.' }, { status: 401 });
  if (session.role !== 'TENANT') return NextResponse.json({ message: 'Tenant access required.' }, { status: 403 });

  // Max 20 roommate requests per hour per person, so nobody can spam everyone.
  const rateLimitError = await authRateLimitResponse(request, 'roommate-request', 20, 60 * 60 * 1000, session.userId);
  if (rateLimitError) return rateLimitError;

  const body = await request.json().catch(() => null);
  const result = requestSchema.safeParse(body);
  if (!result.success || result.data.targetUserId === session.userId) {
    return NextResponse.json({ message: 'Choose a valid roommate profile.' }, { status: 400 });
  }

  const target = await prisma.tenantProfile.findUnique({
    where: { userId: result.data.targetUserId },
    select: { userId: true },
  });
  if (!target) return NextResponse.json({ message: 'Roommate profile not found.' }, { status: 404 });

  // Look at any earlier request between these two people.
  const existing = await prisma.roommateConnection.findUnique({
    where: { requesterId_targetId: { requesterId: session.userId, targetId: target.userId } },
  });
  if (existing?.status === 'PENDING') {
    return NextResponse.json({ message: 'You already sent this request.' }, { status: 409 });
  }
  if (existing?.status === 'ACCEPTED') {
    return NextResponse.json({ message: 'You are already connected.' }, { status: 409 });
  }
  // DECLINED: another try is allowed only after 30 days (stops repeated pestering).
  if (existing?.status === 'DECLINED' && Date.now() - existing.updatedAt.getTime() < THIRTY_DAYS_MS) {
    return NextResponse.json(
      { message: 'You can send another request to this person after 30 days.' },
      { status: 409 }
    );
  }

  // First request, or a retry after the 30 days have passed.
  const connection = await prisma.roommateConnection.upsert({
    where: { requesterId_targetId: { requesterId: session.userId, targetId: target.userId } },
    create: { requesterId: session.userId, targetId: target.userId },
    update: { status: 'PENDING', decidedAt: null },
  });

  // Tell the other person. Phone numbers are NOT shared yet (only after they accept).
  const requester = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true },
  });
  await createNotification({
    userId: target.userId,
    type: 'ROOMMATE_REQUEST_RECEIVED',
    title: `${requester?.name ?? 'Someone'} wants to be your roommate`,
    body: 'Open your dashboard to accept or decline. Phone numbers are shared only after you accept.',
    link: '/dashboard/tenant',
  });

  return NextResponse.json({ connection }, { status: 201 });
}