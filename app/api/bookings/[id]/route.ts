import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { bookingDecisionSchema } from '@/lib/validations';
import { createNotification } from '@/lib/notifications';
import { queueEmail, dispatchEmailOutbox } from '@/lib/email-outbox';
import { bookingDecisionEmailHtml } from '@/lib/email';
import { getApplicationUrl } from '@/lib/auth-tokens';
import { authConfigResponse } from '@/lib/auth-api';


export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const configError = authConfigResponse({ outbox: true });
  if (configError) return configError;
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Sign in required.' }, { status: 401 });
  if (session.role !== 'OWNER') return NextResponse.json({ message: 'Owner access required.' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const result = bookingDecisionSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ message: 'Choose approve or reject.' }, { status: 400 });

  try {
    let booking;
    // Retry only Mongo transaction write conflicts; the conditional inventory update stays authoritative.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        booking = await prisma.$transaction(async (transaction) => {
          const current = await transaction.bookingRequest.findFirst({
            where: { id: params.id, status: 'PENDING', room: { property: { ownerId: session.userId } } },
            select: { id: true, roomId: true },
          });
          if (!current) throw new Error('BOOKING_NOT_PENDING_OR_NOT_OWNED');

          if (result.data.status === 'APPROVED') {
            // Conditional decrement is the inventory lock: only one concurrent approval can take the last bed.
            const inventory = await transaction.room.updateMany({
              where: { id: current.roomId, availableBeds: { gt: 0 } },
              data: { availableBeds: { decrement: 1 } },
            });
            if (inventory.count !== 1) throw new Error('NO_BEDS_AVAILABLE');
          }

          const changed = await transaction.bookingRequest.updateMany({
            where: { id: current.id, status: 'PENDING' },
            data: { status: result.data.status, decidedAt: new Date() },
          });
          if (changed.count !== 1) throw new Error('BOOKING_NOT_PENDING_OR_NOT_OWNED');

          const decided = await transaction.bookingRequest.findUnique({
            where: { id: current.id },
            include: {
              tenant: { select: { id: true, name: true, email: true } },
              room: {
                include: {
                  property: {
                    select: {
                      title: true,
                      address: true,
                      owner: { select: { name: true, ownerProfile: { select: { phone: true, businessName: true } } } },
                    },
                  },
                },
              },
            },
          });
          if (!decided) throw new Error('BOOKING_NOT_PENDING_OR_NOT_OWNED');

          const property = decided.room.property;
          const approved = result.data.status === 'APPROVED';
          const ownerPhone = property.owner.ownerProfile?.phone ?? null;
          const ownerLabel = property.owner.ownerProfile?.businessName ?? property.owner.name;

          // Tenant gets an in-app notification. The owner's phone is shared ONLY on approval.
          await createNotification(
            {
              userId: decided.tenant.id,
              type: approved ? 'BOOKING_APPROVED' : 'BOOKING_REJECTED',
              title: approved ? `Request accepted: ${property.title}` : `Request declined: ${property.title}`,
              body: approved
                ? `${ownerLabel ?? 'The owner'}${ownerPhone ? ` • ${ownerPhone}` : ''}`
                : 'The owner could not accept this request. Try other rooms.',
              link: '/dashboard/tenant',
            },
            transaction
          );

          // Decision emails are transactional, so they are always sent.
          await queueEmail(
            decided.tenant.email,
            approved ? `Accepted: ${property.title}` : `Update on ${property.title}`,
            bookingDecisionEmailHtml({
              tenantName: decided.tenant.name ?? decided.tenant.email,
              roomTitle: property.title,
              approved,
              ownerName: ownerLabel,
              ownerPhone,
              address: approved ? property.address : null,
              dashboardUrl: new URL('/dashboard/tenant', getApplicationUrl(request.url)).toString(),
            }),
            transaction
          );

          return decided;
        });
        break;
      } catch (error) {
        const retryable = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';
        if (!retryable || attempt === 2) throw error;
      }
    }
    await dispatchEmailOutbox(10).catch((error) => {
      console.error('Could not dispatch decision email:', error instanceof Error ? error.message : 'unknown error');
    });
    return NextResponse.json({ booking: { id: booking?.id, status: booking?.status } });
  } catch (error) {
    const reason = error instanceof Error ? error.message : '';
    if (reason === 'NO_BEDS_AVAILABLE') {
      return NextResponse.json({ message: 'No beds remain; this request cannot be approved.' }, { status: 409 });
    }
    if (reason === 'BOOKING_NOT_PENDING_OR_NOT_OWNED') {
      return NextResponse.json({ message: 'Request not found, not yours, or already decided.' }, { status: 404 });
    }
    throw error;
  }
}