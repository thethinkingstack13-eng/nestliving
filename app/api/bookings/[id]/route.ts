import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { bookingDecisionSchema } from '@/lib/validations';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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
        data: { status: result.data.status },
      });
      if (changed.count !== 1) throw new Error('BOOKING_NOT_PENDING_OR_NOT_OWNED');

      return transaction.bookingRequest.findUnique({ where: { id: current.id } });
        });
        break;
      } catch (error) {
        const retryable = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';
        if (!retryable || attempt === 2) throw error;
      }
    }

    return NextResponse.json({ booking });
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