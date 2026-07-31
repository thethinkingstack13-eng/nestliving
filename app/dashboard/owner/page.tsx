import Link from 'next/link';
import { ArrowUpRight, BedDouble, TrendingUp, Clock, IndianRupee, Pencil } from 'lucide-react';
import BookingRequestTable, { type BookingRequestRow } from '@/components/BookingRequestTable';
import Navbar from '@/components/Navbar';

// ---------------------------------------------
// Mock data — replace with Prisma queries scoped
// to the signed-in owner's userId.
// ---------------------------------------------

const STATS = [
  { label: 'Total Listed Rooms', value: '4 Rooms', icon: BedDouble },
  { label: 'Occupancy Rate', value: '75%', icon: TrendingUp },
  { label: 'Pending Applications', value: '3 Requests', icon: Clock },
  { label: 'Monthly Revenue', value: '₹45,000/mo', icon: IndianRupee },
];

const MOCK_BOOKING_REQUESTS: BookingRequestRow[] = [
  {
    id: 'b1',
    tenantName: 'Sana Khan',
    tenantEmail: 'sana.khan@example.com',
    roomTitle: 'Sunlit Private Room near Medical College',
    moveInDate: '2026-08-15',
    compatibilityScore: 94,
    status: 'PENDING',
    message: 'Hi, I am a final-year MBBS student looking for a quiet place close to campus.',
  },
  {
    id: 'b2',
    tenantName: 'Karan Mehta',
    tenantEmail: 'karan.mehta@example.com',
    roomTitle: 'Shared Twin Room, Girls PG',
    moveInDate: '2026-08-01',
    compatibilityScore: 71,
    status: 'PENDING',
  },
  {
    id: 'b3',
    tenantName: 'Priya Nair',
    tenantEmail: 'priya.nair@example.com',
    roomTitle: 'Cozy Shared Room, Walking Distance to DDU',
    moveInDate: '2026-08-10',
    compatibilityScore: 88,
    status: 'PENDING',
  },
  {
    id: 'b4',
    tenantName: 'Farhan Ali',
    tenantEmail: 'farhan.ali@example.com',
    roomTitle: 'Premium Private Studio, Golghar',
    moveInDate: '2026-07-28',
    compatibilityScore: 82,
    status: 'APPROVED',
  },
  {
    id: 'b5',
    tenantName: 'Aditya Verma',
    tenantEmail: 'aditya.verma@example.com',
    roomTitle: 'Quiet Private Room, Ideal for Exam Prep',
    moveInDate: '2026-08-05',
    compatibilityScore: 65,
    status: 'REJECTED',
  },
];

const MOCK_PROPERTIES = [
  {
    id: 'p1',
    title: 'Sunlit Private Room near Medical College',
    location: 'Medical College Road, Gorakhpur',
    bedsFilled: 1,
    totalBeds: 1,
    rentPerMonth: 9500,
  },
  {
    id: 'p2',
    title: 'Shared Twin Room, Girls PG',
    location: 'Sector 12, Gorakhpur',
    bedsFilled: 2,
    totalBeds: 4,
    rentPerMonth: 6500,
  },
  {
    id: 'p3',
    title: 'Premium Private Studio, Golghar',
    location: 'Golghar, Gorakhpur',
    bedsFilled: 1,
    totalBeds: 1,
    rentPerMonth: 13500,
  },
  {
    id: 'p4',
    title: 'Quiet Private Room, Ideal for Exam Prep',
    location: 'Civil Lines, Gorakhpur',
    bedsFilled: 0,
    totalBeds: 1,
    rentPerMonth: 8200,
  },
];

export default function OwnerDashboardPage() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] text-black">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
        {/* Header */}
        <div className="border-b border-black pb-8">
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
            Owner Dashboard
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Manage your listings and respond to tenant applications.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 border-b border-black lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={`flex flex-col gap-2 border-black p-6 ${
                i < STATS.length - 1 ? 'border-r' : ''
              } ${i === 1 ? 'max-lg:border-r-0' : ''}`}
            >
              <stat.icon size={18} strokeWidth={2} className="text-neutral-500" />
              <p className="font-display text-2xl font-bold">{stat.value}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Section 1: Booking requests */}
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold">Incoming Booking Requests</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Approve or reject applications from interested tenants.
          </p>
          <div className="mt-5">
            <BookingRequestTable requests={MOCK_BOOKING_REQUESTS} />
          </div>
        </section>

        {/* Section 2: Active properties */}
        <section className="mt-12 pb-16">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold">My Active Properties</h2>
              <p className="mt-1 text-sm text-neutral-600">
                {MOCK_PROPERTIES.length} properties currently listed.
              </p>
            </div>
            <Link
              href="/dashboard/owner/properties/new"
              className="flex shrink-0 items-center gap-2 rounded-full bg-black px-5 py-2.5 text-xs font-bold tracking-wide text-white transition-colors hover:bg-neutral-800"
            >
              ADD NEW PROPERTY
              <ArrowUpRight size={14} strokeWidth={2.5} />
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {MOCK_PROPERTIES.map((property) => {
              const isFull = property.bedsFilled === property.totalBeds;
              return (
                <div key={property.id} className="border border-black bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-base font-bold leading-tight">
                      {property.title}
                    </h3>
                    <Link
                      href={`/dashboard/owner/properties/${property.id}/edit`}
                      aria-label="Edit property"
                      className="shrink-0 rounded-full border border-black p-2 transition-colors hover:bg-neutral-100"
                    >
                      <Pencil size={14} strokeWidth={2} />
                    </Link>
                  </div>
                  <p className="mt-1 text-xs text-neutral-600">{property.location}</p>

                  <div className="mt-4 flex items-center justify-between border-t border-black pt-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                        Occupancy
                      </p>
                      <p className={`text-sm font-bold ${isFull ? 'text-emerald-700' : 'text-black'}`}>
                        {property.bedsFilled}/{property.totalBeds} beds filled
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                        Rent
                      </p>
                      <p className="text-sm font-bold">
                        ₹{new Intl.NumberFormat('en-IN').format(property.rentPerMonth)}/mo
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
