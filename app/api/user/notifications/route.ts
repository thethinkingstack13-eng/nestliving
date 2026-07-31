import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { notificationPreferencesSchema } from '@/lib/validations';

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'You must be logged in.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const result = notificationPreferencesSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0]?.message ?? 'Invalid input.' },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: result.data,
    select: {
      emailOnBookingRequests: true,
      emailOnRoommateMatches: true,
      emailOnProductAnnouncements: true,
    },
  });

  return NextResponse.json({ preferences: user }, { status: 200 });
}
