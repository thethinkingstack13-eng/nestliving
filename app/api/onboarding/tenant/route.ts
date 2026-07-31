import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { tenantOnboardingSchema } from '@/lib/validations';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'You must be logged in.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const result = tenantOnboardingSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { message: result.error.issues[0]?.message ?? 'Invalid input.' },
      { status: 400 }
    );
  }

  const {
    preferredLocation,
    budgetMin,
    budgetMax,
    cleanliness,
    noisePreference,
    sleepSchedule,
    smokingAllowed,
    petsFriendly,
    bio,
  } = result.data;

  // The tenant's display name comes from the User record created at
  // registration — onboarding doesn't ask for it again.
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ message: 'Account not found.' }, { status: 404 });
  }

  const tenantProfile = await prisma.tenantProfile.upsert({
    where: { userId: session.userId },
    create: {
      userId: session.userId,
      fullName: user.name ?? user.email,
      preferredLocation,
      budgetMin,
      budgetMax,
      bio,
      lifestyleParams: {
        cleanliness,
        noiseLevel: noisePreference,
        sleepSchedule,
        smoking: smokingAllowed,
        pets: petsFriendly,
      },
    },
    update: {
      preferredLocation,
      budgetMin,
      budgetMax,
      bio,
      lifestyleParams: {
        cleanliness,
        noiseLevel: noisePreference,
        sleepSchedule,
        smoking: smokingAllowed,
        pets: petsFriendly,
      },
    },
  });

  return NextResponse.json(tenantProfile, { status: 200 });
}
