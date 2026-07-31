import Navbar from '@/components/Navbar';

// Static "about" copy. Replace with real founder/company info
// whenever it's ready — no logic on this page depends on it.
const VALUES = [
  {
    title: 'Verified, always',
    description:
      'Every listing and every tenant profile goes through a verification step before it appears in search.',
  },
  {
    title: 'Compatibility first',
    description:
      'We match on lifestyle — cleanliness, noise, sleep schedule — not just budget and location.',
  },
  {
    title: 'Zero brokerage',
    description:
      'Owners and tenants connect directly. No middlemen, no hidden brokerage fees.',
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] text-black">
      <Navbar />

      <section className="border-b border-black px-6 py-16 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
            Built for how people actually live together
          </h1>
          <p className="mt-4 max-w-xl text-base text-neutral-700">
            NestLiving started in Gorakhpur with a simple idea: finding a room and a
            roommate shouldn&apos;t mean brokers, guesswork, or moving in with a stranger
            whose habits don&apos;t match yours.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 border-b border-black md:grid-cols-3">
        {VALUES.map((value, i) => (
          <div
            key={value.title}
            className={`p-8 lg:p-12 ${i < VALUES.length - 1 ? 'border-b md:border-b-0 md:border-r' : ''} border-black`}
          >
            <h2 className="font-display text-xl font-bold">{value.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              {value.description}
            </p>
          </div>
        ))}
      </section>

      <section className="px-6 py-16 lg:px-10">
        <p className="max-w-xl text-sm text-neutral-700">
          Have a question, a partnership idea, or found a bug? Reach out any time —
          we&apos;re a small team building this one city at a time.
        </p>
      </section>
    </main>
  );
}
