import Image from 'next/image';
import {
  ArrowUpRight,
  Wifi,
  Wind,
  Dumbbell,
  Zap,
  Users,
  MapPin,
  type LucideIcon,
} from 'lucide-react';
import BookingRequestButton from '@/components/BookingRequestButton';

export type RoomType = 'SHARED' | 'PRIVATE';

export interface RoomCardProps {
  id?: string;
  title: string;
  location: string;
  rentPerMonth: number;
  depositAmount: number;
  roomType: RoomType;
  availableBeds: number;
  totalBeds: number;
  amenities: string[];
  compatibilityScore?: number;
  imageUrl?: string;
  href?: string;
}

// Maps known amenity names to a Lucide icon. Unrecognized amenities
// still render as a plain text pill.
const AMENITY_ICON_MAP: Record<string, LucideIcon> = {
  wifi: Wifi,
  ac: Wind,
  gym: Dumbbell,
  'power backup': Zap,
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN').format(amount);
}

export default function RoomCard({
  title,
  id,
  location,
  rentPerMonth,
  depositAmount,
  roomType,
  availableBeds,
  totalBeds,
  amenities,
  compatibilityScore = 0,
  imageUrl,
  href = '#',
}: RoomCardProps) {
  const isFillingFast = availableBeds <= 1;

  return (
    <div className="flex flex-col border border-black bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Image container */}
      <div className="relative h-48 w-full overflow-hidden border-b border-black bg-neutral-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover"
          />
        ) : <div className="h-full w-full bg-neutral-200" aria-hidden="true" />}

        {/* Compatibility badge */}
        {compatibilityScore > 0 && <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-black bg-emerald-400 px-3 py-1 shadow-[0_0_12px_2px_rgba(52,211,153,0.7)]">
          <span className="h-1.5 w-1.5 rounded-full bg-black" />
          <span className="text-xs font-bold text-black">{compatibilityScore}% MATCH</span>
        </div>}

        {/* Room type tag */}
        <div className="absolute left-3 top-3 rounded-full border border-black bg-white px-3 py-1 text-[10px] font-bold tracking-wide">
          {roomType === 'SHARED' ? 'SHARED ROOM' : 'PRIVATE ROOM'}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-bold leading-tight">{title}</h3>

        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-600">
          <MapPin size={14} strokeWidth={2} />
          <span>{location}</span>
        </div>

        {/* Rent */}
        <div className="mt-4 flex items-baseline gap-1.5">
          <span className="font-display text-2xl font-bold">₹{formatCurrency(rentPerMonth)}</span>
          <span className="text-sm font-medium text-neutral-500">/mo</span>
        </div>
        <p className="mt-0.5 text-xs text-neutral-500">
          ₹{formatCurrency(depositAmount)} refundable deposit
        </p>

        {/* Beds indicator */}
        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold">
          <Users size={14} strokeWidth={2} />
          <span className={isFillingFast ? 'text-[#E11D48]' : 'text-black'}>
            {availableBeds} {availableBeds === 1 ? 'bed' : 'beds'} left of {totalBeds}
          </span>
          {isFillingFast && (
            <span className="text-[#E11D48]">— filling fast</span>
          )}
        </div>

        {/* Amenity pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          {amenities.map((amenity) => {
            const Icon = AMENITY_ICON_MAP[amenity.toLowerCase()];
            return (
              <span
                key={amenity}
                className="inline-flex items-center gap-1.5 rounded-full border border-black px-3 py-1 text-[11px] font-semibold"
              >
                {Icon && <Icon size={12} strokeWidth={2.5} />}
                {amenity}
              </span>
            );
          })}
        </div>

        {/* CTA */}
        {id ? <BookingRequestButton roomId={id} /> : (
          <a href={href} className="mt-6 flex items-center justify-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-bold tracking-wide text-white transition-colors hover:bg-neutral-800">
            VIEW DETAILS <ArrowUpRight size={16} strokeWidth={2.5} />
          </a>
        )}
      </div>
    </div>
  );
}
