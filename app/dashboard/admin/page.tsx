import { Users, Building2, ClipboardList, CalendarCheck } from 'lucide-react';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PropertyApprovalTable, { type PropertyApprovalRow } from '@/components/PropertyApprovalTable';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

const ROLE_BADGE_STYLES = {
  TENANT: 'border-black bg-white text-black',
  OWNER: 'border-black bg-neutral-200 text-black',
  ADMIN: 'border-black bg-[#E11D48] text-white',
} as const;

function formatDate(date: Date) {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session) redirect('/auth/login');
  if (session.role !== 'ADMIN') redirect(`/dashboard/${session.role.toLowerCase()}`);

  const [userCount, propertyCount, pendingCount, bookingCount, pendingProperties, users] = await Promise.all([
    prisma.user.count(),
    prisma.property.count(),
    prisma.property.count({ where: { reviewStatus: 'PENDING', isApproved: false } }),
    prisma.bookingRequest.count(),
    prisma.property.findMany({
      where: { reviewStatus: 'PENDING', isApproved: false },
      include: { owner: { select: { name: true, email: true } }, _count: { select: { rooms: true } } },
      orderBy: { createdAt: 'asc' },
      take: 50,
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ]);

  const approvalRows: PropertyApprovalRow[] = pendingProperties.map((property) => ({
    id: property.id,
    propertyTitle: property.title,
    location: `${property.city}, ${property.state}`,
    ownerName: property.owner.name ?? 'Unnamed owner',
    ownerEmail: property.owner.email,
    roomCount: property._count.rooms,
    submittedDate: property.createdAt.toISOString(),
    status: property.reviewStatus,
  }));

  const stats = [
    { label: 'Total Users', value: userCount.toLocaleString('en-IN'), icon: Users },
    { label: 'Total Properties', value: propertyCount.toLocaleString('en-IN'), icon: Building2 },
    { label: 'Pending Approvals', value: pendingCount.toLocaleString('en-IN'), icon: ClipboardList },
    { label: 'Booking Requests', value: bookingCount.toLocaleString('en-IN'), icon: CalendarCheck },
  ];

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-black">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
        <div className="border-b border-black pb-8">
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-neutral-600">Platform oversight and listing review.</p>
        </div>

        <div className="grid grid-cols-2 border-b border-black lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={stat.label} className={`flex flex-col gap-2 border-black p-6 ${index < stats.length - 1 ? 'border-r' : ''} ${index === 1 ? 'max-lg:border-r-0' : ''}`}>
              <stat.icon size={18} className="text-neutral-500" />
              <p className="font-display text-2xl font-bold">{stat.value}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <section className="mt-10">
          <h2 className="font-display text-xl font-bold">Property approvals</h2>
          <div className="mt-5"><PropertyApprovalTable properties={approvalRows} /></div>
        </section>

        <section className="mt-12 pb-16">
          <h2 className="font-display text-xl font-bold">Users</h2>
          <p className="mt-1 text-sm text-neutral-600">Showing the latest {users.length} accounts.</p>
          <div className="mt-5 overflow-x-auto border border-black bg-white">
            <table className="w-full border-collapse text-left text-sm">
              <thead><tr className="border-b border-black bg-neutral-50">
                <th className="px-5 py-3 text-xs font-bold uppercase">Name</th>
                <th className="border-l border-black px-5 py-3 text-xs font-bold uppercase">Email</th>
                <th className="border-l border-black px-5 py-3 text-xs font-bold uppercase">Role</th>
                <th className="border-l border-black px-5 py-3 text-xs font-bold uppercase">Joined</th>
              </tr></thead>
              <tbody>{users.map((user) => <tr key={user.id} className="border-b border-black last:border-0">
                <td className="px-5 py-4 font-semibold">{user.name ?? 'Unnamed user'}</td>
                <td className="border-l border-black px-5 py-4 text-neutral-600">{user.email}</td>
                <td className="border-l border-black px-5 py-4"><span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold ${ROLE_BADGE_STYLES[user.role]}`}>{user.role}</span></td>
                <td className="border-l border-black px-5 py-4 text-neutral-600">{formatDate(user.createdAt)}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
