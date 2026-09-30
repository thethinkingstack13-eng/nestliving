import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Sign in to find roommates.' }, { status: 401 });
  if (session.role !== 'TENANT') return NextResponse.json({ message: 'Tenant access required.' }, { status: 403 });

  const url = new URL(request.url);
  const location = url.searchParams.get('location')?.trim().slice(0, 100);
  const maxBudgetValue = url.searchParams.get('maxBudget');
  const maxBudget = maxBudgetValue ? Number(maxBudgetValue) : undefined;
  const cursor = url.searchParams.get('cursor');
  if ((maxBudget !== undefined && (!Number.isFinite(maxBudget) || maxBudget < 0))
    || (cursor && !/^[a-f\d]{24}$/i.test(cursor))) {
    return NextResponse.json({ message: 'Invalid roommate search parameters.' }, { status: 400 });
  }

  const currentProfile = await prisma.tenantProfile.findUnique({
    where: { userId: session.userId },
    select: { lifestyleParams: true },
  });
  if (!currentProfile?.lifestyleParams) {
    return NextResponse.json({ message: 'Complete your tenant profile to find compatible roommates.' }, { status: 409 });
  }
  const pageSize = 24;
  const profiles = await prisma.tenantProfile.findMany({
    where: {
      userId: { not: session.userId },
      lifestyleParams: { not: null },
      ...(location ? { preferredLocationKey: { startsWith: location.toLowerCase() } } : {}),
      ...(maxBudget !== undefined ? { budgetMax: { lte: maxBudget } } : {}),
    },
    select: {
      id: true,
      userId: true,
      fullName: true,
      occupation: true,
      avatarUrl: true,
      preferredLocation: true,
      budgetMax: true,
      lifestyleParams: true,
      user: { select: { name: true } },
    },
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    take: pageSize + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = profiles.length > pageSize;
  const page = hasMore ? profiles.slice(0, pageSize) : profiles;
  const sentConnections = page.length ? await prisma.roommateConnection.findMany({
    where: { requesterId: session.userId, targetId: { in: page.map((profile) => profile.userId) } },
    select: { targetId: true },
  }) : [];

  return NextResponse.json({
    currentProfile: currentProfile.lifestyleParams,
    requestedUserIds: sentConnections.map((connection) => connection.targetId),
    roommates: page.map(({ user, ...profile }) => ({
      id: profile.userId,
      fullName: user.name ?? profile.fullName,
      occupation: profile.occupation ?? 'Roommate seeker',
      avatarUrl: profile.avatarUrl,
      preferredLocation: profile.preferredLocation ?? '',
      budgetMax: profile.budgetMax ?? 0,
      lifestyleParams: profile.lifestyleParams,
    })),
    nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
  });
}