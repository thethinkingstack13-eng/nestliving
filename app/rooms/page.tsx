'use client';

import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import RoomCard, { type RoomCardProps, type RoomType } from '@/components/RoomCard';
import Navbar from '@/components/Navbar';

// ---------------------------------------------
// Mock data — replace with a Prisma/API fetch
// ---------------------------------------------

const MOCK_ROOMS: (RoomCardProps & { id: string; gender: 'MALE' | 'FEMALE' | 'ANY'; createdAt: string })[] = [
  {
    id: '1',
    title: 'Sunlit Private Room near Medical College',
    location: 'Medical College Road, Gorakhpur',
    rentPerMonth: 9500,
    depositAmount: 19000,
    roomType: 'PRIVATE',
    availableBeds: 1,
    totalBeds: 1,
    amenities: ['WiFi', 'AC', 'Power Backup'],
    compatibilityScore: 94,
    imageUrl: 'https://picsum.photos/seed/room1/640/480',
    gender: 'ANY',
    createdAt: '2026-07-20',
  },
  {
    id: '2',
    title: 'Shared Twin Room, Girls PG',
    location: 'Sector 12, Gorakhpur',
    rentPerMonth: 6500,
    depositAmount: 13000,
    roomType: 'SHARED',
    availableBeds: 2,
    totalBeds: 4,
    amenities: ['WiFi', 'Gym', 'Power Backup'],
    compatibilityScore: 88,
    imageUrl: 'https://picsum.photos/seed/room2/640/480',
    gender: 'FEMALE',
    createdAt: '2026-07-18',
  },
  {
    id: '3',
    title: 'Cozy Shared Room, Walking Distance to DDU',
    location: 'University Road, Gorakhpur',
    rentPerMonth: 5800,
    depositAmount: 11600,
    roomType: 'SHARED',
    availableBeds: 1,
    totalBeds: 3,
    amenities: ['WiFi', 'AC'],
    compatibilityScore: 91,
    imageUrl: 'https://picsum.photos/seed/room3/640/480',
    gender: 'MALE',
    createdAt: '2026-07-22',
  },
  {
    id: '4',
    title: 'Premium Private Studio, Golghar',
    location: 'Golghar, Gorakhpur',
    rentPerMonth: 13500,
    depositAmount: 27000,
    roomType: 'PRIVATE',
    availableBeds: 1,
    totalBeds: 1,
    amenities: ['WiFi', 'AC', 'Gym', 'Power Backup'],
    compatibilityScore: 82,
    imageUrl: 'https://picsum.photos/seed/room4/640/480',
    gender: 'ANY',
    createdAt: '2026-07-15',
  },
  {
    id: '5',
    title: 'Budget Shared Room for Working Professionals',
    location: 'Betiahata, Gorakhpur',
    rentPerMonth: 4500,
    depositAmount: 9000,
    roomType: 'SHARED',
    availableBeds: 3,
    totalBeds: 4,
    amenities: ['WiFi', 'Power Backup'],
    compatibilityScore: 76,
    imageUrl: 'https://picsum.photos/seed/room5/640/480',
    gender: 'ANY',
    createdAt: '2026-07-10',
  },
  {
    id: '6',
    title: 'Quiet Private Room, Ideal for Exam Prep',
    location: 'Civil Lines, Gorakhpur',
    rentPerMonth: 8200,
    depositAmount: 16400,
    roomType: 'PRIVATE',
    availableBeds: 1,
    totalBeds: 1,
    amenities: ['WiFi', 'AC', 'Power Backup'],
    compatibilityScore: 97,
    imageUrl: 'https://picsum.photos/seed/room6/640/480',
    gender: 'ANY',
    createdAt: '2026-07-24',
  },
];

const AMENITY_OPTIONS = ['WiFi', 'AC', 'Laundry', 'Food Service', 'Gym'];
const SORT_OPTIONS = [
  { value: 'match', label: 'Highest Match' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'newest', label: 'Newest' },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];
type GenderFilter = 'MALE' | 'FEMALE' | 'ANY';

interface Filters {
  city: string;
  minRent: string;
  maxRent: string;
  roomType: RoomType | 'ALL';
  gender: GenderFilter[];
  amenities: string[];
}

const EMPTY_FILTERS: Filters = {
  city: '',
  minRent: '',
  maxRent: '',
  roomType: 'ALL',
  gender: [],
  amenities: [],
};

export default function RoomsPage() {
  // `draftFilters` reflects live sidebar input; `appliedFilters` is what
  // actually drives the grid — updated only when "APPLY FILTERS" is clicked.
  const [draftFilters, setDraftFilters] = useState<Filters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortValue>('match');

  const toggleGender = (value: GenderFilter) => {
    setDraftFilters((prev) => ({
      ...prev,
      gender: prev.gender.includes(value)
        ? prev.gender.filter((g) => g !== value)
        : [...prev.gender, value],
    }));
  };

  const toggleAmenity = (value: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(value)
        ? prev.amenities.filter((a) => a !== value)
        : [...prev.amenities, value],
    }));
  };

  const handleReset = () => {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
  };

  const handleApply = () => {
    setAppliedFilters(draftFilters);
  };

  const filteredRooms = useMemo(() => {
    const min = appliedFilters.minRent ? Number(appliedFilters.minRent) : null;
    const max = appliedFilters.maxRent ? Number(appliedFilters.maxRent) : null;

    const result = MOCK_ROOMS.filter((room) => {
      if (
        appliedFilters.city &&
        !room.location.toLowerCase().includes(appliedFilters.city.toLowerCase())
      ) {
        return false;
      }
      if (appliedFilters.roomType !== 'ALL' && room.roomType !== appliedFilters.roomType) {
        return false;
      }
      if (min !== null && room.rentPerMonth < min) return false;
      if (max !== null && room.rentPerMonth > max) return false;
      if (
        appliedFilters.gender.length > 0 &&
        !appliedFilters.gender.includes(room.gender) &&
        room.gender !== 'ANY'
      ) {
        return false;
      }
      if (
        appliedFilters.amenities.length > 0 &&
        !appliedFilters.amenities.every((a) =>
          room.amenities.some((ra) => ra.toLowerCase() === a.toLowerCase())
        )
      ) {
        return false;
      }
      return true;
    });

    const sorted = [...result].sort((a, b) => {
      switch (sort) {
        case 'price-asc':
          return a.rentPerMonth - b.rentPerMonth;
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'match':
        default:
          return b.compatibilityScore - a.compatibilityScore;
      }
    });

    return sorted;
  }, [appliedFilters, sort]);

  const cityLabel = appliedFilters.city || 'Gorakhpur';

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-black">
      <Navbar />
      <div className="flex flex-col lg:flex-row">
        {/* ============================================= */}
        {/* FILTER SIDEBAR                                 */}
        {/* ============================================= */}
        <aside className="w-full border-b border-black p-6 lg:sticky lg:top-0 lg:h-screen lg:w-80 lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} strokeWidth={2} />
            <h2 className="font-display text-lg font-bold">Filters</h2>
          </div>

          {/* City search */}
          <div className="mt-6">
            <label htmlFor="city" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide">
              City / Neighborhood
            </label>
            <div className="flex items-center border border-black bg-[#FAFAFA] px-3 focus-within:ring-2 focus-within:ring-black">
              <Search size={16} strokeWidth={2} className="text-neutral-500" />
              <input
                id="city"
                type="text"
                value={draftFilters.city}
                onChange={(e) => setDraftFilters((p) => ({ ...p, city: e.target.value }))}
                placeholder="e.g. Golghar, Gorakhpur"
                className="w-full bg-transparent px-2.5 py-2.5 text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Budget */}
          <div className="mt-6">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide">Budget (₹/mo)</p>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                inputMode="numeric"
                value={draftFilters.minRent}
                onChange={(e) => setDraftFilters((p) => ({ ...p, minRent: e.target.value }))}
                placeholder="Min"
                className="w-full border border-black bg-[#FAFAFA] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <input
                type="number"
                inputMode="numeric"
                value={draftFilters.maxRent}
                onChange={(e) => setDraftFilters((p) => ({ ...p, maxRent: e.target.value }))}
                placeholder="Max"
                className="w-full border border-black bg-[#FAFAFA] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          {/* Room type toggle */}
          <div className="mt-6">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide">Room Type</p>
            <div className="grid grid-cols-3 gap-2">
              {(['ALL', 'PRIVATE', 'SHARED'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDraftFilters((p) => ({ ...p, roomType: type }))}
                  aria-pressed={draftFilters.roomType === type}
                  className={`border border-black py-2 text-[11px] font-bold tracking-wide transition-colors ${
                    draftFilters.roomType === type
                      ? 'bg-black text-white'
                      : 'bg-[#FAFAFA] hover:bg-neutral-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Gender preference */}
          <div className="mt-6">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide">Gender Preference</p>
            <div className="flex flex-col gap-2">
              {(['MALE', 'FEMALE', 'ANY'] as const).map((g) => (
                <label key={g} className="flex items-center gap-2.5 border border-black px-3 py-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={draftFilters.gender.includes(g)}
                    onChange={() => toggleGender(g)}
                    className="h-4 w-4 accent-black"
                  />
                  {g === 'MALE' ? 'Male Only' : g === 'FEMALE' ? 'Female Only' : 'Any'}
                </label>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div className="mt-6">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide">Amenities</p>
            <div className="flex flex-col gap-2">
              {AMENITY_OPTIONS.map((amenity) => (
                <label key={amenity} className="flex items-center gap-2.5 border border-black px-3 py-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={draftFilters.amenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                    className="h-4 w-4 accent-black"
                  />
                  {amenity}
                </label>
              ))}
            </div>
          </div>

          {/* Reset / Apply */}
          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-neutral-600 underline underline-offset-2 hover:text-black"
            >
              RESET FILTERS
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="rounded-full bg-black px-5 py-2.5 text-xs font-bold tracking-wide text-white transition-colors hover:bg-neutral-800"
            >
              APPLY FILTERS
            </button>
          </div>
        </aside>

        {/* ============================================= */}
        {/* LISTING GRID                                   */}
        {/* ============================================= */}
        <section className="flex-1 p-6 lg:p-10">
          {/* Header bar */}
          <div className="flex flex-col gap-4 border-b border-black pb-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-700">
              Showing <span className="font-bold text-black">{filteredRooms.length} verified rooms</span> in{' '}
              <span className="font-bold text-black">{cityLabel}</span>
            </p>

            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortValue)}
                className="appearance-none border border-black bg-[#FAFAFA] py-2.5 pl-4 pr-9 text-xs font-bold tracking-wide focus:outline-none focus:ring-2 focus:ring-black"
              >
                {SORT_OPTIONS.map((opt) => (
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

          {/* Grid */}
          {filteredRooms.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredRooms.map((room) => (
                <RoomCard key={room.id} {...room} href={`/rooms/${room.id}`} />
              ))}
            </div>
          ) : (
            <div className="mt-8 border border-black p-10 text-center">
              <p className="font-display text-lg font-bold">No rooms match these filters</p>
              <p className="mt-1 text-sm text-[#E11D48]">
                * Try widening your budget range or clearing an amenity filter.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
