import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const PAGE_SIZE = 24;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const city = url.searchParams.get('city')?.trim().slice(0, 100);
  const minRentText = url.searchParams.get('minRent');
  const maxRentText = url.searchParams.get('maxRent');
  const minRent = minRentText ? Number(minRentText) : undefined;
  const maxRent = maxRentText ? Number(maxRentText) : undefined;
  const roomType = url.searchParams.get('roomType');
  const sort = url.searchParams.get('sort');
  const cursor = url.searchParams.get('cursor');
  const gender = (url.searchParams.get('gender') ?? '').split(',').filter((value) =>
    value === 'MALE' || value === 'FEMALE' || value === 'ANY'
  );
  const amenities = (url.searchParams.get('amenities') ?? '').split(',')
    .map((value) => value.trim()).filter((value) => value.length > 0 && value.length <= 40).slice(0, 20);
  const take = Math.min(Math.max(Number(url.searchParams.get('take')) || PAGE_SIZE, 1), PAGE_SIZE);
  if ((minRent !== undefined && (!Number.isFinite(minRent) || minRent < 0))
    || (maxRent !== undefined && (!Number.isFinite(maxRent) || maxRent < 0))
    || (cursor && !/^[a-f\d]{24}$/i.test(cursor))) {
    return NextResponse.json({ message: 'Invalid room search parameters.' }, { status: 400 });
  }
  const rentPerMonth = {
    ...(minRent !== undefined ? { gte: minRent } : {}),
    ...(maxRent !== undefined ? { lte: maxRent } : {}),
  };

  const rooms = await prisma.room.findMany({
    where: {
      availableBeds: { gt: 0 },
      ...(Object.keys(rentPerMonth).length ? { rentPerMonth } : {}),
      ...(roomType === 'PRIVATE' || roomType === 'SHARED' ? { roomType } : {}),
      ...(gender.length && !gender.includes('ANY')
        ? { genderPreference: { in: [...gender, 'ANY'] } }
        : {}),
      ...(amenities.length ? { amenities: { hasEvery: amenities } } : {}),
      property: {
        isApproved: true,
        reviewStatus: { not: 'REJECTED' },
        ...(city ? {
          OR: [
            { citySearchKey: { startsWith: city.toLowerCase() } },
            { addressSearchKey: { startsWith: city.toLowerCase() } },
          ],
        } : {}),
      },
    },
    include: { property: true },
    orderBy: sort === 'price-asc' ? [{ rentPerMonth: 'asc' }, { id: 'asc' }] : [{ createdAt: 'desc' }, { id: 'desc' }],
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rooms.length > take;
  const page = hasMore ? rooms.slice(0, take) : rooms;
  return NextResponse.json({
    rooms: page.map((room) => ({
      id: room.id,
      title: room.property.title,
      location: `${room.property.city}, ${room.property.state}`,
      rentPerMonth: room.rentPerMonth,
      depositAmount: room.depositAmount,
      roomType: room.roomType,
      availableBeds: room.availableBeds,
      totalBeds: room.totalBeds,
      amenities: room.amenities,
      imageUrl: room.property.imageUrls[0] ?? '',
      imageUrls: room.property.imageUrls,
      gender: room.genderPreference,
      createdAt: room.createdAt,
    })),
    nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
  });
}