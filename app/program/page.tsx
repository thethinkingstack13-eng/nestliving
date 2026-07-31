import Link from 'next/link';
import { ArrowUpRight, Search, MessageSquareHeart, KeyRound } from 'lucide-react';
import Navbar from '@/components/Navbar';

// Static content describing the 3-step NestLiving program.
// Swap icons/copy here if the flow ever changes — nothing else
// on this page depends on this array.
const STEPS = [
  {
    icon: Search,
    title: '1. Discover',
    description:
      'Browse verified rooms and filter by budget, location, and room type — no broker calls needed.',
  },
  {
    icon: MessageSquareHeart,
    title: '2. Match',
    description:
      'Our compatibility engine scores potential roommates on cleanliness, noise, sleep schedule, and more.',
  },
  {
    icon: KeyRound,
    title: '3. Move In',
    description:
      'Send a booking request, get approved by the owner, and move in — all tracked from your dashboard.',
  },
];

export default function ProgramPage() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] text-black">
      <Navbar />

      <section className="border-b border-black px-6 py-16 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
            How the NestLiving program works
          </h1>
          <p className="mt-4 max-w-xl text-base text-neutral-700">
            Three simple steps between you and a verified, compatible place to live.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 border-b border-black md:grid-cols-3">
        {STEPS.map((step, i) => (
          <div
            key={step.title}
            className={`p-8 lg:p-12 ${i < STEPS.length - 1 ? 'border-b md:border-b-0 md:border-r' : ''} border-black`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-black">
              <step.icon size={20} strokeWidth={2} />
            </div>
            <h2 className="mt-5 font-display text-xl font-bold">{step.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">{step.description}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col items-start gap-4 px-6 py-16 lg:px-10">
        <p className="max-w-md text-sm text-neutral-700">
          Ready to see it in action?
        </p>
        <Link
          href="/rooms"
          className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-bold tracking-wide text-white transition-colors hover:bg-neutral-800"
        >
          SEARCH ROOMS
          <ArrowUpRight size={16} strokeWidth={2.5} />
        </Link>
      </section>
    </main>
  );
}
