import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { createBookingSchema } from '@/lib/validations';
import { queueEmail, dispatchEmailOutbox } from '@/lib/email-outbox';
import { bookingRequestEmailHtml } from '@/lib/email';
import { authConfigResponse } from '@/lib/auth-api';
import { createNotification } from '@/lib/notifications';
import { getApplicationUrl } from '@/lib/auth-tokens';

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Sign in required.' }, { status: 401 });
  if (session.role !== 'TENANT') return NextResponse.json({ message: 'Tenant access required.' }, { status: 403 });

  const requests = await prisma.bookingRequest.findMany({
    where: { tenantId: session.userId },
    include: { room: { include: { property: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const configError = authConfigResponse({ outbox: true });
  if (configError) return configError;
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Sign in required.' }, { status: 401 });
  if (session.role !== 'TENANT') return NextResponse.json({ message: 'Tenant access required.' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const result = createBookingSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ message: result.error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 });
  }
  if (new Date(result.data.moveInDate).getTime() < Date.now()) {
    return NextResponse.json({ message: 'Move-in date must be in the future.' }, { status: 400 });
  }




  // Tenant details that the owner will see (name, phone, profile).
  const tenant = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      name: true,
      email: true,
      tenantProfile: {
        select: { phone: true, occupation: true, bio: true, budgetMin: true, budgetMax: true, preferredLocation: true },
      },
    },
  });
  if (!tenant) return NextResponse.json({ message: 'Account not found.' }, { status: 404 });
  const tenantProfile = tenant.tenantProfile;
  const tenantName = tenant.name ?? tenant.email;

  // TURN THIS ON after Phase 3 (phone field in profile) so owners always get a contact number:
  // if (!tenantProfile?.phone) {
  //   return NextResponse.json({ message: 'Add your phone number in your profile first, so the owner can contact you.' }, { status: 400 });
  // }
  const room = await prisma.room.findFirst({
    where: {
      id: result.data.roomId,
      availableBeds: { gt: 0 },
      property: { isApproved: true, reviewStatus: { not: 'REJECTED' } },
    },
    select: {
      id: true,
      property: {
        select: {
          ownerId: true,
          title: true,
          owner: { select: { name: true, email: true, emailOnBookingRequests: true } },
        },
      },
    },
  });
  if (!room) return NextResponse.json({ message: 'This room is no longer available.' }, { status: 409 });

  try {
    const created = await prisma.$transaction(async (transaction) => {
      const existing = await transaction.bookingRequest.findUnique({
        where: { tenantId_roomId: { tenantId: session.userId, roomId: room.id } },
      });
      if (existing?.status === 'PENDING' || existing?.status === 'APPROVED') {
        throw new Error('ACTIVE_BOOKING_EXISTS');
      }

      let booking;
      if (existing) {
        const reopened = await transaction.bookingRequest.updateMany({
          where: { id: existing.id, status: existing.status },
          data: {
            status: 'PENDING',
            moveInDate: new Date(result.data.moveInDate),
            message: result.data.message,
          },
        });
        if (reopened.count !== 1) throw new Error('ACTIVE_BOOKING_EXISTS');
        booking = await transaction.bookingRequest.findUnique({ where: { id: existing.id } });
      } else {
        booking = await transaction.bookingRequest.create({
          data: {
            tenantId: session.userId,
            roomId: room.id,
            moveInDate: new Date(result.data.moveInDate),
            message: result.data.message,
          },
        });
      }

      const moveIn = new Date(result.data.moveInDate);

      // 1) In-app notification: always created.
      await createNotification(
        {
          userId: room.property.ownerId,
          type: 'BOOKING_REQUEST_RECEIVED',
          title: `New request for ${room.property.title}`,
          body: `${tenantName}${tenantProfile?.phone ? ` • ${tenantProfile.phone}` : ''} • move-in ${formatDate(moveIn)}`,
          link: '/dashboard/owner',
        },
        transaction
      );

      // 2) Email: only if the owner kept booking emails switched on.
      if (room.property.owner.emailOnBookingRequests) {
        await queueEmail(
          room.property.owner.email,
          `New booking request for ${room.property.title}`,
          bookingRequestEmailHtml({
            ownerName: room.property.owner.name ?? 'Owner',
            tenantName,
            tenantEmail: tenant.email,
            tenantPhone: tenantProfile?.phone,
            occupation: tenantProfile?.occupation,
            budget:
              tenantProfile?.budgetMin != null && tenantProfile?.budgetMax != null
                ? `₹${tenantProfile.budgetMin} – ₹${tenantProfile.budgetMax}/mo`
                : null,
            preferredLocation: tenantProfile?.preferredLocation,
            bio: tenantProfile?.bio,
            roomTitle: room.property.title,
            moveInDate: formatDate(moveIn),
            requestedAt: formatDate(new Date()),
            message: result.data.message,
            dashboardUrl: new URL('/dashboard/owner', getApplicationUrl(request.url)).toString(),
          }),
          transaction
        );
      }
      return { booking, isNew: !existing };
    });

    await dispatchEmailOutbox(10).catch((error) => {
      console.error('Could not dispatch booking notification:', error instanceof Error ? error.message : 'unknown error');
    });
    return NextResponse.json({ booking: created.booking }, { status: created.isNew ? 201 : 200 });
  } catch (error) {
    if (error instanceof Error && error.message === 'ACTIVE_BOOKING_EXISTS') {
      return NextResponse.json({ message: 'You already have an active request for this room.' }, { status: 409 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: 'You already have a request for this room.' }, { status: 409 });
    }
    throw error;
  }
}