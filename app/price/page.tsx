import { ArrowUpRight, Check } from 'lucide-react';
import Navbar from '@/components/Navbar';

// Static plan data. If pricing ever comes from a backend/config
// service, this is the only array that needs to change.
const PLANS = [
  {
    name: 'Tenant',
    price: 'Free',
    period: 'forever',
    description: 'Browse, match, and apply — no cost to find your room.',
    features: [
      'Unlimited room browsing',
      'Roommate compatibility matching',
      'Direct booking requests to owners',
      'Verified listings only',
    ],
    highlighted: false,
  },
  {
    name: 'Owner — Starter',
    price: '₹499',
    period: '/month per property',
    description: 'List and manage a single property with full owner tools.',
    features: [
      'Unlimited room listings on 1 property',
      'Booking request dashboard',
      'Tenant compatibility scores',
      'Email support',
    ],
    highlighted: true,
  },
  {
    name: 'Owner — Portfolio',
    price: '₹1,999',
    period: '/month',
    description: 'For owners and managers running multiple properties.',
    features: [
      'Unlimited properties & rooms',
      'Priority listing placement',
      'Advanced occupancy analytics',
      'Priority support',
    ],
    highlighted: false,
  },
];

export default function PricePage() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] text-black">
      <Navbar />

      <section className="border-b border-black px-6 py-16 text-center lg:px-10 lg:py-24">
        <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-neutral-700">
          Tenants always browse for free. Owners pay only for what they list.
        </p>
      </section>

      <section className="grid grid-cols-1 border-b border-black md:grid-cols-3">
        {PLANS.map((plan, i) => (
          <div
            key={plan.name}
            className={`flex flex-col p-8 lg:p-10 ${
              i < PLANS.length - 1 ? 'border-b md:border-b-0 md:border-r' : ''
            } border-black ${plan.highlighted ? 'bg-black text-white' : ''}`}
          >
            <p
              className={`text-xs font-bold uppercase tracking-wide ${
                plan.highlighted ? 'text-neutral-300' : 'text-neutral-500'
              }`}
            >
              {plan.name}
            </p>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-bold">{plan.price}</span>
              <span
                className={`text-sm ${plan.highlighted ? 'text-neutral-300' : 'text-neutral-500'}`}
              >
                {plan.period}
              </span>
            </div>
            <p
              className={`mt-3 text-sm ${plan.highlighted ? 'text-neutral-200' : 'text-neutral-700'}`}
            >
              {plan.description}
            </p>

            <ul className="mt-6 flex flex-col gap-2.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check size={16} strokeWidth={2.5} className="mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className={`mt-8 flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold tracking-wide transition-colors ${
                plan.highlighted
                  ? 'bg-white text-black hover:bg-neutral-200'
                  : 'bg-black text-white hover:bg-neutral-800'
              }`}
            >
              GET STARTED
              <ArrowUpRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        ))}
      </section>

      <section className="px-6 py-10 text-center lg:px-10">
        <p className="text-sm text-[#E11D48]">
          * All plans include 0% brokerage on tenant bookings.
        </p>
      </section>
    </main>
  );
}
