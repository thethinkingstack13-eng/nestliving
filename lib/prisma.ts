import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
// caused by Next.js hot-reloading (each file change would otherwise
// spin up a brand-new client and eventually exhaust DB connections).

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
