import Link from 'next/link';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import RoommateCard, { type RoommateLifestyleParams } from '@/components/RoommateCard';
import { StatusBadge } from '@/components/BookingRequestTable';
import { calculateCompatibility, type LifestyleProfile } from '@/lib/compatibility';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

function toLifestyleProfile(value: unknown): LifestyleProfile | null {
  if (!value || typeof value !== 'object') return null;
  const profile = value as Record<string, unknown>;
  if (typeof profile.cleanliness !== 'number' || typeof profile.noiseLevel !== 'number'
    || (profile.sleepSchedule !== 'EARLY_BIRD' && profile.sleepSchedule !== 'NIGHT_OWL')
    || typeof profile.smoking !== 'boolean' || typeof profile.pets !== 'boolean') return null;
  return {
    cleanliness: profile.cleanliness,
    noiseLevel: profile.noiseLevel,
    sleepSchedule: profile.sleepSchedule,
    smoking: profile.smoking,
    pets: profile.pets,
  } as LifestyleProfile;
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function TenantDashboardPage() {
  const session = await getSession();
  if (!session) redirect('/auth/login');
  if (session.role !== 'TENANT') redirect(`/dashboard/${session.role.toLowerCase()}`);

  const [user, profile, bookings] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } }),
    prisma.tenantProfile.findUnique({ where: { userId: session.userId } }),
    prisma.bookingRequest.findMany({
      where: { tenantId: session.userId },
      include: { room: { include: { property: true } } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ]);
  if (!user) redirect('/auth/login');

  const ownLifestyle = toLifestyleProfile(profile?.lifestyleParams);
  const candidates = ownLifestyle && profile ? await prisma.tenantProfile.findMany({
    where: { userId: { not: session.userId }, lifestyleParams: { not: null } },
    select: {
      userId: true,
      fullName: true,
      occupation: true,
      avatarUrl: true,
      preferredLocation: true,
      budgetMax: true,
      lifestyleParams: true,
      user: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 60,
  }) : [];

  const matches = candidates.flatMap((candidate) => {
    const lifestyle = toLifestyleProfile(candidate.lifestyleParams);
    if (!lifestyle) return [];
    return [{
      id: candidate.userId,
      fullName: candidate.user.name ?? candidate.fullName,
      occupation: candidate.occupation ?? 'Roommate seeker',
      preferredLocation: candidate.preferredLocation ?? '',
      budgetMax: candidate.budgetMax ?? 0,
      avatarUrl: candidate.avatarUrl ?? undefined,
      lifestyleParams: lifestyle as LifestyleProfile & RoommateLifestyleParams,
      compatibilityScore: calculateCompatibility(ownLifestyle!, lifestyle),
    }];
  }).sort((left, right) => right.compatibilityScore - left.compatibilityScore).slice(0, 3);

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-black">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
        <div className="flex flex-col gap-5 border border-black bg-white p-8 shadow-[6px_6px_0px_0px_#000000] sm:flex-row sm:items-center sm:justify-between">
          <div><h1 className="font-display text-3xl font-bold leading-tight">Welcome back, {user.name ?? 'Tenant'}</h1><p className="mt-2 text-sm text-neutral-600">Track applications and find compatible roommates.</p></div>
          <Link href="/rooms" className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-bold text-white">BROWSE ROOMS <ArrowUpRight size={16} /></Link>
        </div>

        {!profile && <div className="mt-8 border border-black bg-white p-6"><p className="font-semibold">Complete your roommate profile to get matches.</p><Link href="/onboarding/tenant" className="mt-2 inline-block text-sm underline">Set up profile</Link></div>}

        <section className="mt-10">
          <h2 className="font-display text-xl font-bold">My booking requests</h2>
          {bookings.length ? <div className="mt-5 border border-black bg-white divide-y divide-black">
            {bookings.map((booking) => <div key={booking.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-display text-base font-bold">{booking.room.property.title}</p><div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-600"><MapPin size={13} /><span>{booking.room.property.city}, {booking.room.property.state}</span></div><p className="mt-1 text-xs text-neutral-500">Move-in: {formatDate(booking.moveInDate)}</p></div>
              <StatusBadge status={booking.status} />
            </div>)}
          </div> : <div className="mt-5 border border-black bg-white p-8"><p className="font-semibold">No applications yet.</p><Link href="/rooms" className="mt-2 inline-block text-sm underline">Browse available rooms</Link></div>}
        </section>

        {profile && <section className="mt-12 pb-16">
          <div className="flex items-end justify-between gap-4"><div><h2 className="font-display text-xl font-bold">Recommended roommates</h2><p className="mt-1 text-sm text-neutral-600">Top matches based on saved lifestyle profiles.</p></div><Link href="/roommates" className="text-sm font-semibold underline">See all</Link></div>
          {matches.length ? <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{matches.map((match) => <RoommateCard key={match.id} {...match} />)}</div> : <p className="mt-5 border border-black bg-white p-8 text-sm text-neutral-600">No complete roommate profiles are available yet.</p>}
        </section>}
      </div>
    </main>
  );
}
