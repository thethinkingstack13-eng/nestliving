import Link from 'next/link';
import { ArrowUpRight, Play, Sparkle, MapPin } from 'lucide-react';
import Navbar from '@/components/Navbar';

// ---------------------------------------------
// Static placeholder data
// ---------------------------------------------

const AVATAR_STACK_COUNT = 5;

const METRICS = [
  {
    label: '12k+ Verified Tenants',
    hasAvatarStack: true,
  },
  {
    label: '1,200+ Active Rooms',
    hasAvatarStack: false,
  },
  {
    label: '98% Compatibility Rate',
    hasAvatarStack: false,
  },
];

const PARTNER_BADGES = ['STAYWELL', 'ROOMIO', 'NESTHUB', 'URBANLET'];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] text-black">
      <Navbar />

      {/* ============================================= */}
      {/* HERO — Asymmetric 2-column grid                */}
      {/* ============================================= */}
      <section className="grid grid-cols-1 border-b border-black lg:grid-cols-12">
        {/* Left column — copy + CTAs */}
        <div className="border-b border-black p-8 lg:col-span-7 lg:border-b-0 lg:border-r lg:p-16">
          <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-full border border-black">
            <Sparkle size={18} strokeWidth={2} className="fill-black" />
          </div>

          <h1 className="max-w-xl font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Shared living &amp; roommate discovery made simple.
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-neutral-700">
            Explore verified shared rooms, match with like-minded roommates
            based on lifestyle habits, and secure your place without brokers.
          </p>

          <div className="mt-8 flex items-center gap-4">
            <Link
              href="/rooms"
              className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-bold tracking-wide text-white transition-colors hover:bg-neutral-800"
            >
              SEARCH ROOMS
              <ArrowUpRight size={16} strokeWidth={2.5} />
            </Link>

            <Link
              href="/program"
              aria-label="See how the program works"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-black transition-colors hover:bg-black hover:text-white"
            >
              <Play size={16} strokeWidth={2.5} className="ml-0.5 fill-current" />
            </Link>

            <Link href="/program" className="text-sm font-medium tracking-wide hover:underline">
              WATCH DEMO
            </Link>
          </div>

          <p className="mt-10 text-sm font-medium text-[#E11D48]">
            * Verified profiles and 0% brokerage listing guarantee.
          </p>
        </div>

        {/* Right column — interactive roommate preview card */}
        <div className="flex items-center justify-center bg-neutral-100 p-8 lg:col-span-5">
          <div className="w-full max-w-sm rounded-none border border-black bg-[#FAFAFA] p-6 shadow-[6px_6px_0px_0px_#000000]">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-black bg-neutral-200 font-display text-lg font-bold"
                  aria-hidden="true"
                >
                  RS
                </div>
                <div>
                  <p className="font-display text-base font-bold">Riya Sharma</p>
                  <p className="text-xs text-neutral-600">Product Designer</p>
                </div>
              </div>

              <span className="inline-flex items-center rounded-full border border-black bg-[#E11D48] px-3 py-1 text-xs font-bold text-white shadow-[2px_2px_0px_0px_#000000]">
                94% Match
              </span>
            </div>

            <div className="mt-5 flex items-center gap-1.5 text-xs text-neutral-600">
              <MapPin size={14} strokeWidth={2} />
              <span>Looking near Sector 12, Gorakhpur</span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-black pt-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                  Rent Budget
                </p>
                <p className="font-display text-lg font-bold">₹8k – ₹12k</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                  Move-in
                </p>
                <p className="font-display text-lg font-bold">Aug 2026</p>
              </div>
            </div>

            <Link
              href="/roommates"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-bold tracking-wide text-white transition-colors hover:bg-neutral-800"
            >
              Connect
              <ArrowUpRight size={16} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================= */}
      {/* METRIC FOOTER STRIP — 4-column bordered grid   */}
      {/* ============================================= */}
      <section className="grid grid-cols-2 border-b border-black md:grid-cols-4">
        {METRICS.map((metric) => (
          <div
            key={metric.label}
            className="flex flex-col justify-center gap-3 border-r border-black p-6 last:border-r-0 md:p-8"
          >
            {metric.hasAvatarStack && (
              <div className="flex -space-x-3">
                {Array.from({ length: AVATAR_STACK_COUNT }).map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border border-black bg-neutral-300"
                    style={{ zIndex: AVATAR_STACK_COUNT - i }}
                  />
                ))}
              </div>
            )}
            <p className="font-display text-lg font-bold leading-tight sm:text-xl">
              {metric.label}
            </p>
          </div>
        ))}

        {/* Partner badges cell */}
        <div className="col-span-2 flex flex-col justify-center gap-3 p-6 md:col-span-1 md:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
            Trusted alongside
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {PARTNER_BADGES.map((brand) => (
              <span
                key={brand}
                className="font-display text-sm font-bold tracking-tight text-neutral-400"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
