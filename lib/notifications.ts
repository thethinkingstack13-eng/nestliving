import type { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type Db = Pick<Prisma.TransactionClient, 'notification'>;

// Pass `transaction` as the 2nd argument to create it inside a DB transaction.
export async function createNotification(
  input: { userId: string; type: NotificationType; title: string; body: string; link?: string },
  db: Db = prisma
): Promise<void> {
  await db.notification.create({ data: input });
}