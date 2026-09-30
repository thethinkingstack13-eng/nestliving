'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react';
import Navbar from '@/components/Navbar';
import RoomCard, { type RoomCardProps, type RoomType } from '@/components/RoomCard';

const AMENITIES = ['WiFi', 'AC', 'Laundry', 'Food Service', 'Gym'];
type Gender = 'MALE' | 'FEMALE' | 'ANY';
type Sort = 'price-asc' | 'newest';

interface Filters {
  city: string;
  minRent: string;
  maxRent: string;
  roomType: RoomType | 'ALL';
  gender: Gender[];
  amenities: string[];
}

interface Listing extends RoomCardProps {
  id: string;
  createdAt: string;
}

const EMPTY_FILTERS: Filters = {
  city: '',
  minRent: '',
  maxRent: '',
  roomType: 'ALL',
  gender: [],
  amenities: [],
};

function buildQuery(filters: Filters, sort: Sort, cursor?: string) {
  const query = new URLSearchParams({ sort });
  if (filters.city) query.set('city', filters.city);
  if (filters.minRent) query.set('minRent', filters.minRent);
  if (filters.maxRent) query.set('maxRent', filters.maxRent);
  if (filters.roomType !== 'ALL') query.set('roomType', filters.roomType);
  if (filters.gender.length) query.set('gender', filters.gender.join(','));
  if (filters.amenities.length) query.set('amenities', filters.amenities.join(','));
  if (cursor) query.set('cursor', cursor);
  return query;
}

export default function RoomsPage() {
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<Sort>('newest');
  const [rooms, setRooms] = useState<Listing[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    fetch(`/api/rooms?${buildQuery(filters, sort)}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message ?? 'Could not load rooms.');
        setRooms(result.rooms);
        setNextCursor(result.nextCursor);
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof Error && loadError.name === 'AbortError') return;
        setError('Rooms could not be loaded. Refresh to try again.');
      })
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, [filters, sort]);

  const toggleValue = <T extends string>(key: 'gender' | 'amenities', value: T) => {
    setDraft((current) => {
      const values = current[key] as string[];
      return {
        ...current,
        [key]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value],
      };
    });
  };

  const loadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const response = await fetch(`/api/rooms?${buildQuery(filters, sort, nextCursor)}`);
      const result = await response.json();
      if (!response.ok) throw new Error('Could not load more rooms.');
      setRooms((current) => [...current, ...result.rooms]);
      setNextCursor(result.nextCursor);
    } catch {
      setError('Could not load more rooms. Please try again.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-black">
      <Navbar />
      <div className="flex flex-col lg:flex-row">
        <aside className="w-full border-b border-black p-6 lg:sticky lg:top-0 lg:h-screen lg:w-80 lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} />
            <h2 className="font-display text-lg font-bold">Filters</h2>
          </div>
          <label className="mt-6 block text-xs font-semibold uppercase tracking-wide">
            City / Neighborhood
            <div className="mt-1.5 flex items-center border border-black px-3">
              <Search size={16} className="text-neutral-500" />
              <input value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} placeholder="City or neighborhood" className="w-full bg-transparent px-2.5 py-2.5 text-sm font-normal normal-case outline-none" />
            </div>
          </label>
          <div className="mt-6">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide">Budget (₹/mo)</p>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" min="0" value={draft.minRent} onChange={(event) => setDraft({ ...draft, minRent: event.target.value })} placeholder="Min" className="w-full border border-black bg-transparent px-3 py-2.5 text-sm" />
              <input type="number" min="0" value={draft.maxRent} onChange={(event) => setDraft({ ...draft, maxRent: event.target.value })} placeholder="Max" className="w-full border border-black bg-transparent px-3 py-2.5 text-sm" />
            </div>
          </div>
          <fieldset className="mt-6">
            <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide">Room type</legend>
            <div className="grid grid-cols-3 gap-2">
              {(['ALL', 'PRIVATE', 'SHARED'] as const).map((type) => (
                <button key={type} type="button" aria-pressed={draft.roomType === type} onClick={() => setDraft({ ...draft, roomType: type })} className={`border border-black py-2 text-[11px] font-bold ${draft.roomType === type ? 'bg-black text-white' : 'bg-white'}`}>{type}</button>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-6">
            <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide">Guest preference</legend>
            {(['MALE', 'FEMALE', 'ANY'] as const).map((gender) => (
              <label key={gender} className="mt-2 flex items-center gap-2 border border-black px-3 py-2 text-xs font-semibold">
                <input type="checkbox" checked={draft.gender.includes(gender)} onChange={() => toggleValue('gender', gender)} />
                {gender === 'ANY' ? 'Any' : gender === 'FEMALE' ? 'Women' : 'Men'}
              </label>
            ))}
          </fieldset>
          <fieldset className="mt-6">
            <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wide">Amenities</legend>
            {AMENITIES.map((amenity) => (
              <label key={amenity} className="mt-2 flex items-center gap-2 border border-black px-3 py-2 text-xs font-semibold">
                <input type="checkbox" checked={draft.amenities.includes(amenity)} onChange={() => toggleValue('amenities', amenity)} />
                {amenity}
              </label>
            ))}
          </fieldset>
          <div className="mt-8 flex items-center justify-between gap-3">
            <button type="button" onClick={() => { setDraft(EMPTY_FILTERS); setFilters(EMPTY_FILTERS); }} className="text-xs font-semibold underline">RESET</button>
            <button type="button" onClick={() => setFilters(draft)} className="bg-black px-4 py-2.5 text-xs font-bold text-white">APPLY FILTERS</button>
          </div>
        </aside>

        <section className="min-w-0 flex-1 p-6 lg:p-10">
          <div className="flex flex-col gap-4 border-b border-black pb-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-700">{rooms.length} verified rooms{filters.city ? ` in ${filters.city}` : ''}</p>
            <label className="relative text-xs font-bold uppercase tracking-wide">
              Sort
              <select value={sort} onChange={(event) => setSort(event.target.value as Sort)} className="ml-2 appearance-none border border-black bg-transparent py-2.5 pl-3 pr-8">
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 mt-1 -translate-y-1/2" />
            </label>
          </div>
          {error && <p role="alert" className="mt-6 text-sm text-[#E11D48]">{error}</p>}
          {isLoading ? <p className="mt-8 text-sm text-neutral-600">Loading verified rooms…</p> : rooms.length ? (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {rooms.map((room) => <RoomCard key={room.id} {...room} />)}
            </div>
          ) : !error && <div className="mt-8 border border-black p-10 text-center"><p className="font-display text-lg font-bold">No rooms match these filters</p><p className="mt-1 text-sm text-neutral-600">Try widening your budget or clearing a filter.</p></div>}
          {nextCursor && !isLoading && <button type="button" onClick={() => void loadMore()} disabled={isLoadingMore} className="mt-8 border border-black px-5 py-3 text-sm font-bold disabled:opacity-50">{isLoadingMore ? 'LOADING…' : 'LOAD MORE ROOMS'}</button>}
        </section>
      </div>
    </main>
  );
}
