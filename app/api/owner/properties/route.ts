import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { areOwnedCloudinaryImages } from '@/lib/cloudinary';
import { createPropertySchema } from '@/lib/validations';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Sign in required.' }, { status: 401 });
  if (session.role !== 'OWNER') return NextResponse.json({ message: 'Owner access required.' }, { status: 403 });

  const properties = await prisma.property.findMany({
    where: { ownerId: session.userId },
    include: { rooms: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json({ properties });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Sign in required.' }, { status: 401 });
  if (session.role !== 'OWNER') return NextResponse.json({ message: 'Owner access required.' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const result = createPropertySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ message: result.error.issues[0]?.message ?? 'Invalid listing.' }, { status: 400 });
  }
  if (!areOwnedCloudinaryImages(result.data.imageUrls, session.userId, 'property')) {
    return NextResponse.json({ message: 'Upload listing photos using this account.' }, { status: 400 });
  }

  const { amenities, totalBeds, ...listing } = result.data;
  const property = await prisma.property.create({
    data: {
      ownerId: session.userId,
      title: listing.title,
      description: listing.description,
      address: listing.address,
      city: listing.city,
      citySearchKey: listing.city.trim().toLowerCase(),
      addressSearchKey: listing.address.trim().toLowerCase(),
      state: listing.state,
      imageUrls: listing.imageUrls,
      reviewStatus: 'PENDING',
      isApproved: false,
      rooms: {
        create: {
          roomType: listing.roomType,
          totalBeds,
          availableBeds: totalBeds,
          rentPerMonth: listing.rentPerMonth,
          depositAmount: listing.depositAmount,
          availabilityDate: new Date(listing.availabilityDate),
          genderPreference: listing.genderPreference,
          amenities,
        },
      },
    },
    include: { rooms: true },
  });
  return NextResponse.json({ property }, { status: 201 });
}