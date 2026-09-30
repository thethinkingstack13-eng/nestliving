import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { ownerOnboardingSchema } from '@/lib/validations';
import { encryptGovernmentId } from '@/lib/owner-id';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'You must be logged in.' }, { status: 401 });
  }
  if (session.role !== 'OWNER') {
    return NextResponse.json({ message: 'Only owners can complete owner onboarding.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const result = ownerOnboardingSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0]?.message ?? 'Invalid input.' },
      { status: 400 }
    );
  }

  const { phone, businessName, governmentId, city, address, agreedToTerms } = result.data;
  const encryptedGovernmentId = encryptGovernmentId(governmentId);

  await prisma.ownerProfile.upsert({
    where: { userId: session.userId },
    create: {
      userId: session.userId,
      phone,
      businessName,
      governmentId: encryptedGovernmentId,
      city,
      address,
      agreedToTerms,
    },
    update: {
      phone,
      businessName,
      governmentId: encryptedGovernmentId,
      city,
      address,
      agreedToTerms,
    },
  });

  return NextResponse.json({ message: 'Owner profile saved.' }, { status: 200 });
}
