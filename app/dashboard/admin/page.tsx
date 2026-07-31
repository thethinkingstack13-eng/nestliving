import { Users, Building2, ClipboardList, CalendarCheck } from 'lucide-react';
import PropertyApprovalTable, {
  type PropertyApprovalRow,
} from '@/components/PropertyApprovalTable';
import Navbar from '@/components/Navbar';

// ---------------------------------------------
// Mock data — replace with Prisma queries once the
// admin API routes exist (e.g. prisma.user.findMany(),
// prisma.property.findMany({ where: { isApproved: false } })).
// ---------------------------------------------

const STATS = [
  { label: 'Total Users', value: '1,204', icon: Users },
  { label: 'Total Properties', value: '86', icon: Building2 },
  { label: 'Pending Approvals', value: '3', icon: ClipboardList },
  { label: 'Total Bookings', value: '312', icon: CalendarCheck },
];

const PENDING_PROPERTIES: PropertyApprovalRow[] = [
  {
    id: 'p1',
    propertyTitle: 'Sunlit Private Room near Medical College',
    location: 'Medical College Road, Gorakhpur',
    ownerName: 'Farhan Ali',
    ownerEmail: 'farhan.ali@example.com',
    roomCount: 1,
    submittedDate: '2026-07-24',
    status: 'PENDING',
  },
  {
    id: 'p2',
    propertyTitle: 'Shared Twin Room, Girls PG',
    location: 'Sector 12, Gorakhpur',
    ownerName: 'Riya Sharma',
    ownerEmail: 'riya.sharma@example.com',
    roomCount: 2,
    submittedDate: '2026-07-22',
    status: 'PENDING',
  },
  {
    id: 'p3',
    propertyTitle: 'Premium Private Studio, Golghar',
    location: 'Golghar, Gorakhpur',
    ownerName: 'Karan Mehta',
    ownerEmail: 'karan.mehta@example.com',
    roomCount: 1,
    submittedDate: '2026-07-20',
    status: 'APPROVED',
  },
];

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'TENANT' | 'OWNER' | 'ADMIN';
  joinedDate: string;
}

const USERS: MockUser[] = [
  { id: 'u1', name: 'Anam Khan', email: 'anam.khan@example.com', role: 'TENANT', joinedDate: '2026-06-01' },
  { id: 'u2', name: 'Farhan Ali', email: 'farhan.ali@example.com', role: 'OWNER', joinedDate: '2026-05-18' },
  { id: 'u3', name: 'Riya Sharma', email: 'riya.sharma@example.com', role: 'OWNER', joinedDate: '2026-06-10' },
  { id: 'u4', name: 'Sana Khan', email: 'sana.khan@example.com', role: 'TENANT', joinedDate: '2026-07-02' },
  { id: 'u5', name: 'Priya Nair', email: 'priya.nair@example.com', role: 'TENANT', joinedDate: '2026-07-15' },
];

const ROLE_BADGE_STYLES: Record<MockUser['role'], string> = {
  TENANT: 'border-black bg-white text-black',
  OWNER: 'border-black bg-neutral-200 text-black',
  ADMIN: 'border-black bg-[#E11D48] text-white',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] text-black">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
        {/* Header */}
        <div className="border-b border-black pb-8">
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Platform-wide oversight — approve properties and manage users.
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

        {/* Section 1: Property approvals */}
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold">Property Approvals</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Review new property submissions before they go live in search.
          </p>
          <div className="mt-5">
            <PropertyApprovalTable properties={PENDING_PROPERTIES} />
          </div>
        </section>

        {/* Section 2: All users */}
        <section className="mt-12 pb-16">
          <h2 className="font-display text-xl font-bold">All Users</h2>
          <p className="mt-1 text-sm text-neutral-600">
            {USERS.length} accounts registered on the platform.
          </p>

          <div className="mt-5 overflow-hidden border border-black bg-white">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-black bg-neutral-50">
                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wide">Name</th>
                    <th className="border-l border-black px-5 py-3 text-xs font-bold uppercase tracking-wide">
                      Email
                    </th>
                    <th className="border-l border-black px-5 py-3 text-xs font-bold uppercase tracking-wide">
                      Role
                    </th>
                    <th className="border-l border-black px-5 py-3 text-xs font-bold uppercase tracking-wide">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {USERS.map((user) => (
                    <tr key={user.id} className="border-b border-black last:border-b-0">
                      <td className="px-5 py-4 font-semibold">{user.name}</td>
                      <td className="border-l border-black px-5 py-4 text-neutral-600">
                        {user.email}
                      </td>
                      <td className="border-l border-black px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold ${ROLE_BADGE_STYLES[user.role]}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="border-l border-black px-5 py-4 text-neutral-600">
                        {formatDate(user.joinedDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked cards */}
            <div className="divide-y divide-black md:hidden">
              {USERS.map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-3 p-5">
                  <div>
                    <p className="text-sm font-semibold leading-tight">{user.name}</p>
                    <p className="text-xs text-neutral-500">{user.email}</p>
                    <p className="mt-1 text-xs text-neutral-400">
                      Joined {formatDate(user.joinedDate)}
                    </p>
                  </div>
                  <span
                    className={`whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-bold ${ROLE_BADGE_STYLES[user.role]}`}
                  >
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
