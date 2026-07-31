import Link from 'next/link';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { StatusBadge, type BookingStatus } from '@/components/BookingRequestTable';
import RoommateCard, { type RoommateLifestyleParams } from '@/components/RoommateCard';
import { calculateCompatibility, type LifestyleProfile } from '@/lib/compatibility';
import Navbar from '@/components/Navbar';

// ---------------------------------------------
// Mock data — replace with Prisma queries scoped
// to the signed-in tenant's userId.
// ---------------------------------------------

const TENANT_NAME = 'Anam';

const CURRENT_USER_PROFILE: LifestyleProfile = {
  cleanliness: 4,
  noiseLevel: 2,
  sleepSchedule: 'EARLY_BIRD',
  smoking: false,
  pets: true,
};

interface MyBookingRequest {
  id: string;
  roomTitle: string;
  location: string;
  moveInDate: string;
  status: BookingStatus;
}

const MY_BOOKING_REQUESTS: MyBookingRequest[] = [
  {
    id: 'r1',
    roomTitle: 'Quiet Private Room, Ideal for Exam Prep',
    location: 'Civil Lines, Gorakhpur',
    moveInDate: '2026-08-05',
    status: 'PENDING',
  },
  {
    id: 'r2',
    roomTitle: 'Cozy Shared Room, Walking Distance to DDU',
    location: 'University Road, Gorakhpur',
    moveInDate: '2026-08-12',
    status: 'APPROVED',
  },
  {
    id: 'r3',
    roomTitle: 'Budget Shared Room for Working Professionals',
    location: 'Betiahata, Gorakhpur',
    moveInDate: '2026-07-30',
    status: 'REJECTED',
  },
];

interface RecommendedRoommate {
  id: string;
  fullName: string;
  occupation: string;
  preferredLocation: string;
  budgetMax: number;
  lifestyleParams: RoommateLifestyleParams & Pick<LifestyleProfile, 'noiseLevel'>;
}

const RECOMMENDED_ROOMMATES: RecommendedRoommate[] = [
  {
    id: 'm1',
    fullName: 'Priya Nair',
    occupation: 'CAT Aspirant',
    preferredLocation: 'University Road, Gorakhpur',
    budgetMax: 8000,
    lifestyleParams: { cleanliness: 4, noiseLevel: 2, sleepSchedule: 'EARLY_BIRD', smoking: false, pets: true },
  },
  {
    id: 'm2',
    fullName: 'Farhan Ali',
    occupation: 'Chartered Accountant',
    preferredLocation: 'Betiahata, Gorakhpur',
    budgetMax: 13000,
    lifestyleParams: { cleanliness: 5, noiseLevel: 2, sleepSchedule: 'EARLY_BIRD', smoking: false, pets: false },
  },
  {
    id: 'm3',
    fullName: 'Riya Sharma',
    occupation: 'Product Designer',
    preferredLocation: 'Sector 12, Gorakhpur',
    budgetMax: 12000,
    lifestyleParams: { cleanliness: 4, noiseLevel: 2, sleepSchedule: 'EARLY_BIRD', smoking: false, pets: true },
  },
  {
    id: 'm4',
    fullName: 'Sana Khan',
    occupation: 'MBBS Student',
    preferredLocation: 'Medical College Road, Gorakhpur',
    budgetMax: 9000,
    lifestyleParams: { cleanliness: 3, noiseLevel: 3, sleepSchedule: 'NIGHT_OWL', smoking: false, pets: true },
  },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function TenantDashboardPage() {
  const topRoommates = RECOMMENDED_ROOMMATES.map((roommate) => ({
    ...roommate,
    compatibilityScore: calculateCompatibility(CURRENT_USER_PROFILE, roommate.lifestyleParams),
  }))
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-black">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
        {/* Welcome banner */}
        <div className="flex flex-col gap-5 border border-black bg-white p-8 shadow-[6px_6px_0px_0px_#000000] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold leading-tight">
              Welcome back, {TENANT_NAME}
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              Track your applications and discover new compatible roommates.
            </p>
          </div>
          <Link
            href="/rooms"
            className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-bold tracking-wide text-white transition-colors hover:bg-neutral-800"
          >
            BROWSE ROOMS
            <ArrowUpRight size={16} strokeWidth={2.5} />
          </Link>
        </div>

        {/* Section 1: My booking requests */}
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold">My Submitted Booking Requests</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Live status of every application you&apos;ve sent to property owners.
          </p>

          {MY_BOOKING_REQUESTS.length > 0 ? (
            <div className="mt-5 border border-black bg-white">
              <div className="divide-y divide-black">
                {MY_BOOKING_REQUESTS.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-display text-base font-bold leading-tight">
                        {request.roomTitle}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-600">
                        <MapPin size={13} strokeWidth={2} />
                        <span>{request.location}</span>
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">
                        Requested move-in: {formatDate(request.moveInDate)}
                      </p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-5 border border-black bg-white p-10 text-center">
              <p className="font-display text-lg font-bold">No applications yet</p>
              <p className="mt-1 text-sm text-neutral-600">
                Browse rooms and send your first booking request.
              </p>
            </div>
          )}
        </section>

        {/* Section 2: Recommended roommates */}
        <section className="mt-12 pb-16">
          <h2 className="font-display text-xl font-bold">Recommended Roommates</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Your top 3 matches based on lifestyle compatibility.
          </p>

          <div className="mt-5 flex gap-6 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible">
            {topRoommates.map((roommate) => (
              <div key={roommate.id} className="min-w-[280px] lg:min-w-0">
                <RoommateCard
                  id={roommate.id}
                  fullName={roommate.fullName}
                  occupation={roommate.occupation}
                  preferredLocation={roommate.preferredLocation}
                  budgetMax={roommate.budgetMax}
                  lifestyleParams={roommate.lifestyleParams}
                  compatibilityScore={roommate.compatibilityScore}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
