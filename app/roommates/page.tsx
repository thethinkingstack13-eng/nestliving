'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Search, Wallet } from 'lucide-react';
import Navbar from '@/components/Navbar';
import RoommateCard, { type RoommateLifestyleParams } from '@/components/RoommateCard';
import { calculateCompatibility, type LifestyleProfile } from '@/lib/compatibility';

interface Roommate {
  id: string;
  fullName: string;
  occupation: string;
  preferredLocation: string;
  budgetMax: number;
  avatarUrl?: string;
  lifestyleParams: RoommateLifestyleParams & Pick<LifestyleProfile, 'noiseLevel'>;
}

interface RoommateResponse {
  currentProfile: unknown;
  requestedUserIds: string[];
  nextCursor: string | null;
  roommates: Array<Omit<Roommate, 'lifestyleParams' | 'avatarUrl'> & {
    avatarUrl?: string | null;
    lifestyleParams: unknown;
  }>;
}

function isLifestyleProfile(value: unknown): value is LifestyleProfile {
  if (!value || typeof value !== 'object') return false;
  const profile = value as Record<string, unknown>;
  return typeof profile.cleanliness === 'number'
    && typeof profile.noiseLevel === 'number'
    && (profile.sleepSchedule === 'EARLY_BIRD' || profile.sleepSchedule === 'NIGHT_OWL')
    && typeof profile.smoking === 'boolean'
    && typeof profile.pets === 'boolean';
}

export default function RoommatesPage() {
  const [location, setLocation] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [minimumScore, setMinimumScore] = useState('0');
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [requestedUserIds, setRequestedUserIds] = useState<string[]>([]);
  const [currentProfile, setCurrentProfile] = useState<LifestyleProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const query = new URLSearchParams();
      if (location.trim()) query.set('location', location.trim());
      if (maxBudget) query.set('maxBudget', maxBudget);
      setIsLoading(true);
      setError(null);
      fetch(`/api/roommates?${query}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as RoommateResponse & { message?: string };
        if (!response.ok) throw new Error(result.message ?? 'Could not load roommate profiles.');
        if (!isLifestyleProfile(result.currentProfile)) throw new Error('Complete your lifestyle profile to view matches.');
        setCurrentProfile(result.currentProfile);
        setRequestedUserIds(result.requestedUserIds);
        setNextCursor(result.nextCursor);

        const mapped: Roommate[] = result.roommates.flatMap((person) => {
          if (!isLifestyleProfile(person.lifestyleParams)) return [];
          return [{ ...person, avatarUrl: person.avatarUrl ?? undefined, lifestyleParams: person.lifestyleParams }];
        });
        setRoommates(mapped);
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof Error && loadError.name === 'AbortError') return;
        setError(loadError instanceof Error ? loadError.message : 'Could not load roommate profiles.');
      })
      .finally(() => setIsLoading(false));
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [location, maxBudget]);

  const loadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const query = new URLSearchParams({ cursor: nextCursor });
      if (location.trim()) query.set('location', location.trim());
      if (maxBudget) query.set('maxBudget', maxBudget);
      const response = await fetch(`/api/roommates?${query}`);
      const result = await response.json() as RoommateResponse & { message?: string };
      if (!response.ok) throw new Error(result.message ?? 'Could not load more profiles.');
      const mapped = result.roommates.flatMap((person) => {
        if (!isLifestyleProfile(person.lifestyleParams)) return [];
        return [{ ...person, avatarUrl: person.avatarUrl ?? undefined, lifestyleParams: person.lifestyleParams }];
      });
      setRoommates((current) => [...current, ...mapped]);
      setRequestedUserIds((current) => [...new Set([...current, ...result.requestedUserIds])]);
      setNextCursor(result.nextCursor);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load more profiles.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const matches = useMemo(() => roommates
    .map((roommate) => ({
      ...roommate,
      compatibilityScore: currentProfile
        ? calculateCompatibility(currentProfile, roommate.lifestyleParams)
        : 0,
    }))
    .filter((roommate) => roommate.compatibilityScore >= Number(minimumScore))
    .sort((left, right) => right.compatibilityScore - left.compatibilityScore),
  [roommates, currentProfile, minimumScore]);

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-black">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
        <div className="border-b border-black pb-8">
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">Find Compatible Roommates</h1>
          <p className="mt-2 text-sm text-neutral-600">Profiles and photos are shared by tenants who completed their match profile.</p>
        </div>
        <div className="flex flex-col gap-4 border-b border-black py-6 lg:flex-row">
          <label className="flex flex-1 items-center border border-black px-3">
            <Search size={16} className="text-neutral-500" />
            <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Search by location" className="w-full bg-transparent px-2.5 py-2.5 text-sm outline-none" />
          </label>
          <label className="flex items-center border border-black px-3 lg:w-56">
            <Wallet size={16} className="text-neutral-500" />
            <input type="number" min="0" value={maxBudget} onChange={(event) => setMaxBudget(event.target.value)} placeholder="Max budget (₹/mo)" className="w-full bg-transparent px-2.5 py-2.5 text-sm outline-none" />
          </label>
          <label className="relative flex items-center border border-black px-3 lg:w-52">
            <select value={minimumScore} onChange={(event) => setMinimumScore(event.target.value)} className="w-full appearance-none bg-transparent py-2.5 text-sm font-semibold outline-none">
              <option value="0">All matches</option>
              <option value="70">70% or higher</option>
              <option value="85">85% or higher</option>
            </select>
            <ChevronDown size={14} className="pointer-events-none" />
          </label>
        </div>
        {error && <div className="mt-8 border border-black p-8 text-center"><p role="alert" className="text-sm text-[#E11D48]">{error}</p><Link href="/onboarding/tenant" className="mt-3 inline-block font-semibold underline">Complete your profile</Link></div>}
        {isLoading ? <p className="mt-8 text-sm text-neutral-600">Loading roommate profiles…</p> : !error && (
          <>
            <p className="pt-6 text-sm text-neutral-600"><span className="font-bold text-black">{matches.length}</span> compatible roommates found</p>
            {matches.length ? <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {matches.map((roommate) => <RoommateCard key={roommate.id} {...roommate} initiallyRequested={requestedUserIds.includes(roommate.id)} />)}
            </div> : <div className="mt-6 border border-black p-10 text-center"><p className="font-display text-lg font-bold">No roommates match these filters</p></div>}
            {nextCursor && <button type="button" onClick={() => void loadMore()} disabled={isLoadingMore} className="mt-8 border border-black px-5 py-3 text-sm font-bold disabled:opacity-50">{isLoadingMore ? 'LOADING…' : 'LOAD MORE PROFILES'}</button>}
          </>
        )}
      </div>
    </main>
  );
}
