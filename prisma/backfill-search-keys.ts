import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BATCH_SIZE = 200;
const WRITE_CONCURRENCY = 20;

async function processWrites<T>(items: T[], update: (item: T) => Promise<unknown>) {
  for (let offset = 0; offset < items.length; offset += WRITE_CONCURRENCY) {
    await Promise.all(items.slice(offset, offset + WRITE_CONCURRENCY).map(update));
  }
}

async function main() {
  let propertyCursor: string | undefined;
  while (true) {
    const properties = await prisma.property.findMany({
      select: { id: true, city: true, address: true },
      orderBy: { id: 'asc' },
      take: BATCH_SIZE,
      ...(propertyCursor ? { cursor: { id: propertyCursor }, skip: 1 } : {}),
    });
    if (!properties.length) break;
    await processWrites(properties, (property) => prisma.property.update({
      where: { id: property.id },
      data: {
        citySearchKey: property.city.trim().toLowerCase(),
        addressSearchKey: property.address.trim().toLowerCase(),
      },
    }));
    propertyCursor = properties[properties.length - 1].id;
  }

  let tenantCursor: string | undefined;
  while (true) {
    const profiles = await prisma.tenantProfile.findMany({
      where: { preferredLocation: { not: null } },
      select: { id: true, preferredLocation: true },
      orderBy: { id: 'asc' },
      take: BATCH_SIZE,
      ...(tenantCursor ? { cursor: { id: tenantCursor }, skip: 1 } : {}),
    });
    if (!profiles.length) break;
    await processWrites(profiles, (profile) => prisma.tenantProfile.update({
      where: { id: profile.id },
      data: { preferredLocationKey: profile.preferredLocation?.trim().toLowerCase() ?? '' },
    }));
    tenantCursor = profiles[profiles.length - 1].id;
  }

  console.log('Search keys backfilled.');
}

main()
  .catch((error) => {
    console.error('Search-key backfill failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });