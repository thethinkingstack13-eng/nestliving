import Link from 'next/link';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { Mail, MapPin, Wallet, Building2, Phone, Pencil, BadgeCheck, CalendarDays } from 'lucide-react';
import type { LucideIcon } from 'lucide-react'; import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import Navbar from '@/components/Navbar';


// One labelled row of the profile card. Long values stay on ONE line and get
// an ellipsis only if they truly don't fit (the full value shows on hover).
function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value?: string | null }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5 px-5 py-3 sm:px-6">
      <Icon size={15} strokeWidth={2} className="mt-0.5 shrink-0 text-neutral-500" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
        {value ? (
          <p className="truncate text-[13px] font-medium sm:text-sm" title={value}>{value}</p>
        ) : (
          <p className="text-[13px] text-neutral-400 sm:text-sm">Not added</p>
        )}
      </div>
    </div>
  );
}



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
  const tenant = user.tenantProfile;
  const owner = user.ownerProfile;
  const phone = owner?.phone ?? tenant?.phone ?? null;
  const location = owner?.city ?? tenant?.preferredLocation ?? null;
  const headline = owner?.businessName ?? tenant?.occupation ?? null;
  const avatarUrl = tenant?.avatarUrl ?? null;
  const memberSince = user.createdAt.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

  // Profile completeness: how many of these 6 things are filled in.
  const checklist = [
    Boolean(user.name),
    Boolean(phone),
    Boolean(location),
    Boolean(headline),
    user.role === 'TENANT' ? Boolean(tenant?.bio) : Boolean(owner?.address),
    user.role === 'TENANT' ? Boolean(tenant?.lifestyleParams) : Boolean(owner),
  ];
  const completeness = Math.round((checklist.filter(Boolean).length / checklist.length) * 100);
  return (
    <main className="min-h-screen bg-[#FAFAFA] text-black">
      <Navbar />

      <div className="mx-auto max-w-3xl px-6 py-10 lg:px-10">


        {/* Header card */}



        {/* Header card */}
        <div className="border border-black bg-white shadow-[4px_4px_0px_0px_#000000] sm:shadow-[6px_6px_0px_0px_#000000]">
          {/* Top: avatar, name, badges, small Edit button on the right */}
          <div className="flex items-start gap-3 p-5 sm:items-center sm:gap-4 sm:p-8">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                width={64}
                height={64}
                className="h-14 w-14 shrink-0 rounded-full border border-black object-cover sm:h-16 sm:w-16"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-black bg-neutral-200 font-display text-lg font-bold sm:h-16 sm:w-16 sm:text-xl">
                {(user.name ?? user.email).slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h1 className="break-words font-display text-xl font-bold leading-tight sm:text-2xl">
                {user.name ?? 'Unnamed User'}
              </h1>
              {headline && <p className="mt-0.5 truncate text-sm text-neutral-600">{headline}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-black px-3 py-1 text-[11px] font-bold">{user.role}</span>
                {user.emailVerifiedAt && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500 bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                    <BadgeCheck size={12} strokeWidth={2.5} />
                    Verified
                  </span>
                )}
              </div>
            </div>

            <Link
              href="/settings"
              aria-label="Edit profile"
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-black px-3 text-xs font-bold transition-colors hover:bg-neutral-100"
            >
              <Pencil size={13} strokeWidth={2} />
              Edit
            </Link>
          </div>

          {/* Email gets its own full-width row, so it stays on one line */}
          <div className="border-t border-black">
            <InfoRow icon={Mail} label="Email" value={user.email} />
          </div>

          {/* Phone, location, member since */}
          <div
            className={`grid grid-cols-1 divide-y divide-black border-t border-black ${user.role === 'ADMIN' ? '' : 'sm:grid-cols-3 sm:divide-x sm:divide-y-0'
              }`}
          >
            {user.role !== 'ADMIN' && <InfoRow icon={Phone} label="Phone" value={phone} />}
            {user.role !== 'ADMIN' && <InfoRow icon={MapPin} label="Location" value={location} />}
            <InfoRow icon={CalendarDays} label="Member since" value={memberSince} />
          </div>

          {/* Completeness bar (not shown for admins) */}
          {user.role !== 'ADMIN' && (
            <div className="border-t border-black px-5 py-4 sm:px-8">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Profile {completeness}% complete</span>
                {completeness < 100 && (
                  <Link
                    href={user.role === 'TENANT' ? '/onboarding/tenant' : '/onboarding/owner'}
                    className="underline"
                  >
                    Complete it
                  </Link>
                )}
              </div>
              <div className="mt-2 h-2 w-full border border-black bg-neutral-100">
                <div className="h-full bg-black" style={{ width: `${completeness}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Tenant profile details */}


        {user.role === 'TENANT' && (
          <section className="mt-8 border border-black bg-white p-5 sm:p-8">
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
          <section className="mt-8 border border-black bg-white p-5 sm:p-8">
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
