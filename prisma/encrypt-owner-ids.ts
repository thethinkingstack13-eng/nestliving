import { PrismaClient } from '@prisma/client';
import { encryptGovernmentId, isEncryptedGovernmentId } from '../lib/owner-id';

const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.ownerProfile.findMany({
    select: { id: true, governmentId: true },
  });
  let encryptedCount = 0;

  for (const profile of profiles) {
    if (isEncryptedGovernmentId(profile.governmentId)) continue;

    const result = await prisma.ownerProfile.updateMany({
      where: { id: profile.id, governmentId: profile.governmentId },
      data: { governmentId: encryptGovernmentId(profile.governmentId) },
    });
    encryptedCount += result.count;
  }

  console.log(`Encrypted ${encryptedCount} existing owner ID record(s).`);
}

main()
  .catch((error) => {
    console.error('Failed to encrypt existing owner IDs:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });