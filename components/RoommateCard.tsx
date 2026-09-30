'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight, Check, MapPin, Sunrise, Moon, Cigarette, PawPrint, Sparkles } from 'lucide-react';
import { getCompatibilityTier, type SleepSchedule } from '@/lib/compatibility';

export interface RoommateLifestyleParams {
  cleanliness: number; // 1-5
  sleepSchedule: SleepSchedule;
  smoking: boolean;
  pets: boolean;
}

export interface RoommateCardProps {
  id: string;
  fullName: string;
  occupation: string;
  preferredLocation: string;
  budgetMax: number;
  lifestyleParams: RoommateLifestyleParams;
  compatibilityScore: number;
  avatarUrl?: string;
  initiallyRequested?: boolean;
  onConnect?: (id: string) => void;
}

const TIER_BADGE_STYLES: Record<'high' | 'medium' | 'low', string> = {
  high: 'border-emerald-500 bg-emerald-100 text-emerald-800 shadow-[0_0_10px_1px_rgba(16,185,129,0.5)]',
  medium: 'border-amber-500 bg-amber-100 text-amber-800',
  low: 'border-neutral-400 bg-neutral-100 text-neutral-700',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN').format(amount);
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function RoommateCard({
  id,
  fullName,
  occupation,
  preferredLocation,
  budgetMax,
  lifestyleParams,
  compatibilityScore,
  avatarUrl,
  initiallyRequested = false,
  onConnect,
}: RoommateCardProps) {
  const [requestSent, setRequestSent] = useState(initiallyRequested);
  const [isSending, setIsSending] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const tier = getCompatibilityTier(compatibilityScore);

  const handleConnect = async () => {
    if (requestSent || isSending) return;
    setIsSending(true);
    setRequestError(null);
    try {
      if (onConnect) {
        await onConnect(id);
      } else {
        const response = await fetch('/api/roommate-connections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserId: id }),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.message ?? 'Could not send request.');
      }
      setRequestSent(true);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Could not send request.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col border border-black bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <div className="relative h-14 w-14 overflow-hidden rounded-full border border-black">
              <Image src={avatarUrl} alt={fullName} fill className="object-cover" />
            </div>
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-black bg-neutral-200 font-display text-lg font-bold">
              {initials(fullName)}
            </div>
          )}
          <div>
            <p className="font-display text-base font-bold leading-tight">{fullName}</p>
            <p className="text-xs text-neutral-600">{occupation}</p>
          </div>
        </div>

        <span
          className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold ${TIER_BADGE_STYLES[tier]}`}
        >
          {compatibilityScore}% MATCH
        </span>
      </div>

      {/* Location */}
      <div className="mt-4 flex items-center gap-1.5 text-xs text-neutral-600">
        <MapPin size={14} strokeWidth={2} />
        <span>{preferredLocation}</span>
      </div>

      {/* Budget pill */}
      <div className="mt-3 inline-flex w-fit items-center rounded-full border border-black px-3 py-1.5 text-xs font-bold">
        Max Budget: ₹{formatCurrency(budgetMax)}/mo
      </div>

      {/* Lifestyle tags */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-black px-3 py-1 text-[11px] font-semibold">
          {lifestyleParams.sleepSchedule === 'EARLY_BIRD' ? (
            <Sunrise size={12} strokeWidth={2.5} />
          ) : (
            <Moon size={12} strokeWidth={2.5} />
          )}
          {lifestyleParams.sleepSchedule === 'EARLY_BIRD' ? 'Early Bird' : 'Night Owl'}
        </span>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-black px-3 py-1 text-[11px] font-semibold">
          <Cigarette size={12} strokeWidth={2.5} />
          {lifestyleParams.smoking ? 'Smoker' : 'Non-Smoker'}
        </span>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-black px-3 py-1 text-[11px] font-semibold">
          <PawPrint size={12} strokeWidth={2.5} />
          {lifestyleParams.pets ? 'Pet Friendly' : 'No Pets'}
        </span>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-black px-3 py-1 text-[11px] font-semibold">
          <Sparkles size={12} strokeWidth={2.5} />
          Cleanliness: {lifestyleParams.cleanliness}/5
        </span>
      </div>

      {/* CTA */}
      {requestError && <p role="alert" className="mt-4 text-xs text-[#E11D48]">{requestError}</p>}
      <button
        type="button"
        onClick={handleConnect}
        disabled={requestSent || isSending}
        className={`mt-6 flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold tracking-wide transition-colors ${
          requestSent
            ? 'cursor-default border border-black bg-white text-black'
            : 'bg-black text-white hover:bg-neutral-800'
        }`}
      >
        {isSending ? 'SENDING REQUEST…' : requestSent ? (
          <>
            REQUEST SENT
            <Check size={16} strokeWidth={2.5} />
          </>
        ) : (
          <>
            SEND CONNECT REQUEST
            <ArrowUpRight size={16} strokeWidth={2.5} />
          </>
        )}
      </button>
    </div>
  );
}
