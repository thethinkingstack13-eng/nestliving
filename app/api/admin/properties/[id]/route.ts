import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { z } from 'zod';

const decisionSchema = z.object({ status: z.enum(['APPROVED', 'REJECTED']) });

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Sign in required.' }, { status: 401 });
  if (session.role !== 'ADMIN') return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const result = decisionSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ message: 'Choose approve or reject.' }, { status: 400 });

  const updated = await prisma.property.updateMany({
    where: { id: params.id, reviewStatus: 'PENDING' },
    data: {
      reviewStatus: result.data.status,
      isApproved: result.data.status === 'APPROVED',
    },
  });
  if (updated.count !== 1) return NextResponse.json({ message: 'Pending listing not found.' }, { status: 404 });
  return NextResponse.json({ status: result.data.status });
}