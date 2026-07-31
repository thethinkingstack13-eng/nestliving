import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Mail, MapPin, Wallet, Building2, Phone, Pencil } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import Navbar from '@/components/Navbar';

// Server component: reads the session cookie directly (no client fetch
// needed) and pulls the user's own profile from Prisma. Middleware
// already blocks unauthenticated visits, but we redirect again here
// as a safety net in case this page is ever reached without it.
export default async function ProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect('/auth/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { tenantProfile: true, ownerProfile: true },
  });

  if (!user) {
    redirect('/auth/login');
  }

  const lifestyle = user.tenantProfile?.lifestyleParams as
    | { cleanliness?: number; noiseLevel?: number; sleepSchedule?: string; smoking?: boolean; pets?: boolean }
    | null
    | undefined;

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-black">
      <Navbar />

      <div className="mx-auto max-w-3xl px-6 py-10 lg:px-10">
        {/* Header card */}
        <div className="flex items-center justify-between gap-4 border border-black bg-white p-8 shadow-[6px_6px_0px_0px_#000000]">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-black bg-neutral-200 font-display text-xl font-bold">
              {(user.name ?? user.email).slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold leading-tight">
                {user.name ?? 'Unnamed User'}
              </h1>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-neutral-600">
                <Mail size={14} strokeWidth={2} />
                {user.email}
              </div>
              <span className="mt-2 inline-flex items-center rounded-full border border-black px-3 py-1 text-[11px] font-bold">
                {user.role}
              </span>
            </div>
          </div>
          <Link
            href="/settings"
            className="flex shrink-0 items-center gap-2 rounded-full border border-black px-4 py-2 text-xs font-bold transition-colors hover:bg-neutral-100"
          >
            <Pencil size={13} strokeWidth={2} />
            Edit
          </Link>
        </div>

        {/* Tenant profile details */}
        {user.role === 'TENANT' && (
          <section className="mt-8 border border-black bg-white p-8">
            <h2 className="font-display text-lg font-bold">Lifestyle Profile</h2>
            {user.tenantProfile ? (
              <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="flex items-start gap-2.5">
                  <MapPin size={16} strokeWidth={2} className="mt-0.5 text-neutral-500" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Preferred Location
                    </p>
                    <p className="text-sm font-medium">
                      {user.tenantProfile.preferredLocation ?? '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Wallet size={16} strokeWidth={2} className="mt-0.5 text-neutral-500" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Budget Range
                    </p>
                    <p className="text-sm font-medium">
                      {user.tenantProfile.budgetMin != null && user.tenantProfile.budgetMax != null
                        ? `₹${user.tenantProfile.budgetMin} – ₹${user.tenantProfile.budgetMax}/mo`
                        : '—'}
                    </p>
                  </div>
                </div>
                {lifestyle && (
                  <>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Cleanliness
                      </p>
                      <p className="text-sm font-medium">{lifestyle.cleanliness ?? '—'}/5</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Sleep Schedule
                      </p>
                      <p className="text-sm font-medium">
                        {lifestyle.sleepSchedule === 'EARLY_BIRD' ? 'Early Bird' : 'Night Owl'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-neutral-600">
                You haven&apos;t completed your lifestyle profile yet.{' '}
                <Link href="/onboarding/tenant" className="font-semibold underline">
                  Finish it now
                </Link>
                .
              </p>
            )}
          </section>
        )}

        {/* Owner profile details */}
        {user.role === 'OWNER' && (
          <section className="mt-8 border border-black bg-white p-8">
            <h2 className="font-display text-lg font-bold">Owner Details</h2>
            {user.ownerProfile ? (
              <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="flex items-start gap-2.5">
                  <Building2 size={16} strokeWidth={2} className="mt-0.5 text-neutral-500" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Business Name
                    </p>
                    <p className="text-sm font-medium">{user.ownerProfile.businessName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone size={16} strokeWidth={2} className="mt-0.5 text-neutral-500" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Phone
                    </p>
                    <p className="text-sm font-medium">{user.ownerProfile.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin size={16} strokeWidth={2} className="mt-0.5 text-neutral-500" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Operating City
                    </p>
                    <p className="text-sm font-medium">{user.ownerProfile.city}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-neutral-600">
                You haven&apos;t completed your owner verification yet.{' '}
                <Link href="/onboarding/owner" className="font-semibold underline">
                  Finish it now
                </Link>
                .
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
