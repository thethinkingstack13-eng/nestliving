import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

const requestSchema = z.object({ targetUserId: z.string().regex(/^[a-f\d]{24}$/i) });

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Sign in to connect with roommates.' }, { status: 401 });
  if (session.role !== 'TENANT') return NextResponse.json({ message: 'Tenant access required.' }, { status: 403 });

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

  const connection = await prisma.roommateConnection.upsert({
    where: { requesterId_targetId: { requesterId: session.userId, targetId: target.userId } },
    create: { requesterId: session.userId, targetId: target.userId },
    update: { status: 'PENDING' },
  });
  return NextResponse.json({ connection }, { status: 201 });
}