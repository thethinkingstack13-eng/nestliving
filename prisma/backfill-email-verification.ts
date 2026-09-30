import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cutoffValue = process.env.EMAIL_VERIFICATION_CUTOFF;
  const cutoff = cutoffValue ? new Date(cutoffValue) : null;
  if (!cutoff || Number.isNaN(cutoff.getTime())) {
    throw new Error('Set EMAIL_VERIFICATION_CUTOFF to an ISO timestamp captured before deployment.');
  }

  const result = await prisma.user.updateMany({
    where: { emailVerifiedAt: null, createdAt: { lt: cutoff } },
    data: { emailVerifiedAt: cutoff },
  });
  console.log(`Marked ${result.count} pre-existing account(s) as verified.`);
}

main()
  .catch((error) => {
    console.error('Email-verification backfill failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });