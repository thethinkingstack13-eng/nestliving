import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { createNotification } from '@/lib/notifications';

const schema = z.object({ status: z.enum(['ACCEPTED', 'DECLINED']) });

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Sign in required.' }, { status: 401 });
  if (session.role !== 'TENANT') return NextResponse.json({ message: 'Tenant access required.' }, { status: 403 });

  const result = schema.safeParse(await request.json().catch(() => null));
  if (!result.success) return NextResponse.json({ message: 'Choose accept or decline.' }, { status: 400 });

  // Only the person who RECEIVED the request can answer it, and only once.
  const updated = await prisma.roommateConnection.updateMany({
    where: { id: params.id, targetId: session.userId, status: 'PENDING' },
    data: { status: result.data.status, decidedAt: new Date() },
  });
  if (updated.count !== 1) {
    return NextResponse.json({ message: 'Request not found or already answered.' }, { status: 404 });
  }

  const connection = await prisma.roommateConnection.findUnique({
    where: { id: params.id },
    include: {
      requester: { select: { id: true, name: true, tenantProfile: { select: { phone: true } } } },
      target: { select: { id: true, name: true, tenantProfile: { select: { phone: true } } } },
    },
  });

  if (connection) {
    const targetName = connection.target.name ?? 'Your match';
    const requesterName = connection.requester.name ?? 'Your match';

    if (result.data.status === 'ACCEPTED') {
      // Phones are exchanged ONLY now that both sides agreed.
      await createNotification({
        userId: connection.requester.id,
        type: 'ROOMMATE_ACCEPTED',
        title: `${targetName} accepted your roommate request`,
        body: `Phone: ${connection.target.tenantProfile?.phone ?? 'not added yet'}`,
        link: '/dashboard/tenant',
      });
      await createNotification({
        userId: connection.target.id,
        type: 'ROOMMATE_ACCEPTED',
        title: `You are now connected with ${requesterName}`,
        body: `Phone: ${connection.requester.tenantProfile?.phone ?? 'not added yet'}`,
        link: '/dashboard/tenant',
      });
    } else {
      await createNotification({
        userId: connection.requester.id,
        type: 'ROOMMATE_DECLINED',
        title: 'Roommate request update',
        body: 'This person is not available right now. Try other matches.',
        link: '/roommates',
      });
    }
  }
  return NextResponse.json({ ok: true });
}