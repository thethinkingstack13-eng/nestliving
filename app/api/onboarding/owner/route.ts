import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { ownerOnboardingSchema } from '@/lib/validations';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'You must be logged in.' }, { status: 401 });
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

  const ownerProfile = await prisma.ownerProfile.upsert({
    where: { userId: session.userId },
    create: {
      userId: session.userId,
      phone,
      businessName,
      governmentId,
      city,
      address,
      agreedToTerms,
    },
    update: {
      phone,
      businessName,
      governmentId,
      city,
      address,
      agreedToTerms,
    },
  });

  return NextResponse.json(ownerProfile, { status: 200 });
}
