'use client';

import { useMemo, useState } from 'react';
import { Search, Wallet, ChevronDown } from 'lucide-react';
import RoommateCard, { type RoommateLifestyleParams } from '@/components/RoommateCard';
import { calculateCompatibility, type LifestyleProfile } from '@/lib/compatibility';
import Navbar from '@/components/Navbar';

// ---------------------------------------------
// The signed-in tenant's own lifestyle profile.
// In production this comes from their TenantProfile
// row (see prisma/schema.prisma) rather than a constant.
// ---------------------------------------------
const CURRENT_USER_PROFILE: LifestyleProfile = {
  cleanliness: 4,
  noiseLevel: 2,
  sleepSchedule: 'EARLY_BIRD',
  smoking: false,
  pets: true,
};

interface MockRoommate {
  id: string;
  fullName: string;
  occupation: string;
  preferredLocation: string;
  budgetMax: number;
  avatarUrl?: string;
  lifestyleParams: RoommateLifestyleParams & Pick<LifestyleProfile, 'noiseLevel'>;
}

const MOCK_ROOMMATES: MockRoommate[] = [
  {
    id: '1',
    fullName: 'Riya Sharma',
    occupation: 'Product Designer',
    preferredLocation: 'Sector 12, Gorakhpur',
    budgetMax: 12000,
    lifestyleParams: { cleanliness: 4, noiseLevel: 2, sleepSchedule: 'EARLY_BIRD', smoking: false, pets: true },
  },
  {
    id: '2',
    fullName: 'Aditya Verma',
    occupation: 'Backend Engineer',
    preferredLocation: 'Golghar, Gorakhpur',
    budgetMax: 15000,
    lifestyleParams: { cleanliness: 5, noiseLevel: 1, sleepSchedule: 'EARLY_BIRD', smoking: false, pets: false },
  },
  {
    id: '3',
    fullName: 'Sana Khan',
    occupation: 'MBBS Student',
    preferredLocation: 'Medical College Road, Gorakhpur',
    budgetMax: 9000,
    lifestyleParams: { cleanliness: 3, noiseLevel: 3, sleepSchedule: 'NIGHT_OWL', smoking: false, pets: true },
  },
  {
    id: '4',
    fullName: 'Karan Mehta',
    occupation: 'Freelance Photographer',
    preferredLocation: 'Civil Lines, Gorakhpur',
    budgetMax: 11000,
    lifestyleParams: { cleanliness: 2, noiseLevel: 4, sleepSchedule: 'NIGHT_OWL', smoking: true, pets: false },
  },
  {
    id: '5',
    fullName: 'Priya Nair',
    occupation: 'CAT Aspirant',
    preferredLocation: 'University Road, Gorakhpur',
    budgetMax: 8000,
    lifestyleParams: { cleanliness: 4, noiseLevel: 2, sleepSchedule: 'EARLY_BIRD', smoking: false, pets: true },
  },
  {
    id: '6',
    fullName: 'Farhan Ali',
    occupation: 'Chartered Accountant',
    preferredLocation: 'Betiahata, Gorakhpur',
    budgetMax: 13000,
    lifestyleParams: { cleanliness: 5, noiseLevel: 2, sleepSchedule: 'EARLY_BIRD', smoking: false, pets: false },
  },
];

const COMPATIBILITY_OPTIONS = [
  { value: '0', label: 'All Matches' },
  { value: '80', label: '>80% Match' },
  { value: '90', label: '>90% Match' },
] as const;

export default function RoommatesPage() {
  const [locationQuery, setLocationQuery] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [minCompatibility, setMinCompatibility] = useState<'0' | '80' | '90'>('0');

  const roommatesWithScores = useMemo(() => {
    return MOCK_ROOMMATES.map((roommate) => ({
      ...roommate,
      compatibilityScore: calculateCompatibility(CURRENT_USER_PROFILE, roommate.lifestyleParams),
    })).sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  }, []);

  const filteredRoommates = useMemo(() => {
    const budgetLimit = maxBudget ? Number(maxBudget) : null;
    const compatibilityFloor = Number(minCompatibility);

    return roommatesWithScores.filter((roommate) => {
      if (
        locationQuery &&
        !roommate.preferredLocation.toLowerCase().includes(locationQuery.toLowerCase())
      ) {
        return false;
      }
      if (budgetLimit !== null && roommate.budgetMax > budgetLimit) return false;
      if (roommate.compatibilityScore < compatibilityFloor) return false;
      return true;
    });
  }, [roommatesWithScores, locationQuery, maxBudget, minCompatibility]);

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-black">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
        {/* Header */}
        <div className="border-b border-black pb-8">
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
            Find Compatible Roommates
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Matched based on your lifestyle habits &amp; sleep schedule.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col gap-4 border-b border-black py-6 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center border border-black bg-[#FAFAFA] px-3 focus-within:ring-2 focus-within:ring-black">
            <Search size={16} strokeWidth={2} className="text-neutral-500" />
            <input
              type="text"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              placeholder="Search by location…"
              className="w-full bg-transparent px-2.5 py-2.5 text-sm focus:outline-none"
            />
          </div>

          <div className="flex items-center border border-black bg-[#FAFAFA] px-3 focus-within:ring-2 focus-within:ring-black lg:w-56">
            <Wallet size={16} strokeWidth={2} className="text-neutral-500" />
            <input
              type="number"
              inputMode="numeric"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              placeholder="Max budget (₹/mo)"
              className="w-full bg-transparent px-2.5 py-2.5 text-sm focus:outline-none"
            />
          </div>

          <div className="relative lg:w-52">
            <select
              value={minCompatibility}
              onChange={(e) => setMinCompatibility(e.target.value as '0' | '80' | '90')}
              className="w-full appearance-none border border-black bg-[#FAFAFA] py-2.5 pl-4 pr-9 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-black"
            >
              {COMPATIBILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              strokeWidth={2.5}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
            />
          </div>
        </div>

        {/* Results count */}
        <p className="pt-6 text-sm text-neutral-600">
          <span className="font-bold text-black">{filteredRoommates.length}</span> compatible
          roommates found
        </p>

        {/* Grid */}
        {filteredRoommates.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRoommates.map((roommate) => (
              <RoommateCard
                key={roommate.id}
                id={roommate.id}
                fullName={roommate.fullName}
                occupation={roommate.occupation}
                preferredLocation={roommate.preferredLocation}
                budgetMax={roommate.budgetMax}
                lifestyleParams={roommate.lifestyleParams}
                compatibilityScore={roommate.compatibilityScore}
                avatarUrl={roommate.avatarUrl}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 border border-black p-10 text-center">
            <p className="font-display text-lg font-bold">No roommates match these filters</p>
            <p className="mt-1 text-sm text-[#E11D48]">
              * Try lowering the minimum compatibility or widening your budget.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
