import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, BedDouble, TrendingUp, Clock, IndianRupee } from 'lucide-react';
import BookingRequestTable, { type BookingRequestRow } from '@/components/BookingRequestTable';
import Navbar from '@/components/Navbar';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-IN').format(value);
}

export default async function OwnerDashboardPage() {
  const session = await getSession();
  if (!session) redirect('/auth/login');
  if (session.role !== 'OWNER') redirect(`/dashboard/${session.role.toLowerCase()}`);

  const [properties, rooms, pendingCount, approvedBookings] = await Promise.all([
    prisma.property.findMany({
      where: { ownerId: session.userId },
      include: { rooms: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.room.findMany({
      where: { property: { ownerId: session.userId } },
      select: { totalBeds: true, availableBeds: true },
      take: 500,
    }),
    prisma.bookingRequest.count({ where: { status: 'PENDING', room: { property: { ownerId: session.userId } } } }),
    prisma.bookingRequest.findMany({
      where: { status: 'APPROVED', room: { property: { ownerId: session.userId } } },
      select: { room: { select: { rentPerMonth: true } } },
      take: 500,
    }),
  ]);

  const occupancy = rooms.length
    ? Math.round((rooms.reduce((sum, room) => sum + room.totalBeds - room.availableBeds, 0)
      / rooms.reduce((sum, room) => sum + room.totalBeds, 0)) * 100)
    : 0;
  const monthlyRevenue = approvedBookings.reduce((sum, booking) => sum + booking.room.rentPerMonth, 0);

  const requests = await prisma.bookingRequest.findMany({
    where: { status: 'PENDING', room: { property: { ownerId: session.userId } } },
    include: { tenant: { select: { name: true, email: true } }, room: { include: { property: true } } },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });
  const requestRows: BookingRequestRow[] = requests.map((request) => ({
    id: request.id,
    tenantName: request.tenant.name ?? request.tenant.email,
    tenantEmail: request.tenant.email,
    roomTitle: request.room.property.title,
    moveInDate: request.moveInDate.toISOString(),
    status: request.status,
    message: request.message ?? undefined,
  }));

  const stats = [
    { label: 'Listed Rooms', value: rooms.length.toLocaleString('en-IN'), icon: BedDouble },
    { label: 'Occupancy Rate', value: `${occupancy}%`, icon: TrendingUp },
    { label: 'Pending Applications', value: pendingCount.toLocaleString('en-IN'), icon: Clock },
    { label: 'Monthly Booked Rent', value: `₹${formatMoney(monthlyRevenue)}`, icon: IndianRupee },
  ];

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-black">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
        <div className="flex flex-col gap-4 border-b border-black pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div><h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">Owner Dashboard</h1><p className="mt-2 text-sm text-neutral-600">Manage listings and respond to tenant applications.</p></div>
          <Link href="/dashboard/owner/properties/new" className="inline-flex items-center justify-center gap-2 bg-black px-5 py-3 text-xs font-bold text-white">ADD LISTING <ArrowUpRight size={15} /></Link>
        </div>

        <div className="grid grid-cols-2 border-b border-black lg:grid-cols-4">
          {stats.map((stat, index) => <div key={stat.label} className={`flex flex-col gap-2 border-black p-6 ${index < stats.length - 1 ? 'border-r' : ''} ${index === 1 ? 'max-lg:border-r-0' : ''}`}>
            <stat.icon size={18} className="text-neutral-500" /><p className="font-display text-2xl font-bold">{stat.value}</p><p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{stat.label}</p>
          </div>)}
        </div>

        <section className="mt-10">
          <h2 className="font-display text-xl font-bold">Incoming booking requests</h2>
          <div className="mt-5"><BookingRequestTable requests={requestRows} /></div>
        </section>

        <section className="mt-12 pb-16">
          <h2 className="font-display text-xl font-bold">My properties</h2>
          {properties.length ? <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => {
              const totalBeds = property.rooms.reduce((sum, room) => sum + room.totalBeds, 0);
              const availableBeds = property.rooms.reduce((sum, room) => sum + room.availableBeds, 0);
              const cheapestRent = property.rooms.length ? Math.min(...property.rooms.map((room) => room.rentPerMonth)) : 0;
              return <article key={property.id} className="border border-black bg-white">
                <div className="relative h-44 border-b border-black bg-neutral-100">
                  {property.imageUrls[0] && <Image src={property.imageUrls[0]} alt={property.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3"><h3 className="font-display text-base font-bold">{property.title}</h3><span className="shrink-0 border border-black px-2 py-1 text-[10px] font-bold">{property.reviewStatus}</span></div>
                  <p className="mt-1 text-xs text-neutral-600">{property.city}, {property.state}</p>
                  <div className="mt-4 flex justify-between border-t border-black pt-3 text-sm"><span>{totalBeds - availableBeds}/{totalBeds} beds occupied</span><span>₹{formatMoney(cheapestRent)}/mo</span></div>
                  {property.reviewStatus === 'REJECTED' && <p className="mt-3 text-xs text-[#E11D48]">This listing was not approved. Update it before resubmitting.</p>}
                </div>
              </article>;
            })}
          </div> : <div className="mt-5 border border-black bg-white p-8"><p className="font-semibold">No listings yet.</p><Link href="/dashboard/owner/properties/new" className="mt-2 inline-block text-sm underline">Create your first room listing</Link></div>}
        </section>
      </div>
    </main>
  );
}
