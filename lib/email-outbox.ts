import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

const MAX_ATTEMPTS = 8;
const STALE_LOCK_MS = 5 * 60 * 1000;

function getOutboxKey(): Buffer {
  const key = process.env.EMAIL_OUTBOX_ENCRYPTION_KEY;
  if (!key || !/^[a-fA-F0-9]{64}$/.test(key)) {
    throw new Error('EMAIL_OUTBOX_ENCRYPTION_KEY must be a 64-character hexadecimal key.');
  }
  return Buffer.from(key, 'hex');
}

function encryptHtml(html: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getOutboxKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(html, 'utf8'), cipher.final()]);
  return `v1:${iv.toString('base64url')}:${cipher.getAuthTag().toString('base64url')}:${ciphertext.toString('base64url')}`;
}

function decryptHtml(payload: string): string {
  const [version, iv, tag, ciphertext] = payload.split(':');
  if (version !== 'v1' || !iv || !tag || !ciphertext) throw new Error('Unknown encrypted email format.');
  const decipher = createDecipheriv('aes-256-gcm', getOutboxKey(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

export async function queueEmail(
  to: string,
  subject: string,
  html: string,
  database: Pick<Prisma.TransactionClient, 'emailOutbox'> = prisma
): Promise<void> {
  await database.emailOutbox.create({
    data: { to, subject, encryptedHtml: encryptHtml(html) },
  });
}

export async function dispatchEmailOutbox(limit = 20) {
  const now = new Date();
  const staleLock = new Date(now.getTime() - STALE_LOCK_MS);
  await prisma.authToken.deleteMany({ where: { expiresAt: { lt: now } } });
  await prisma.emailOutbox.deleteMany({
    where: { status: { in: ['SENT', 'FAILED'] }, updatedAt: { lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } },
  });
  const candidates = await prisma.emailOutbox.findMany({
    where: {
      OR: [
        { status: 'PENDING', nextAttemptAt: { lte: now } },
        { status: 'SENDING', lockedAt: { lte: staleLock } },
      ],
    },
    orderBy: { nextAttemptAt: 'asc' },
    take: Math.min(Math.max(limit, 1), 100),
  });

  let sent = 0;
  let failed = 0;
  for (const job of candidates) {
    const claim = await prisma.emailOutbox.updateMany({
      where: job.status === 'PENDING'
        ? { id: job.id, status: 'PENDING', nextAttemptAt: { lte: now } }
        : { id: job.id, status: 'SENDING', lockedAt: job.lockedAt ?? undefined },
      data: { status: 'SENDING', lockedAt: now, attempts: { increment: 1 } },
    });
    if (claim.count !== 1) continue;

    const attempts = job.attempts + 1;
    try {
      await sendEmail({ to: job.to, subject: job.subject, html: decryptHtml(job.encryptedHtml) });
      await prisma.emailOutbox.update({
        where: { id: job.id },
        data: { status: 'SENT', lockedAt: null, lastError: null },
      });
      sent += 1;
    } catch (error) {
      const delayMs = Math.min(6 * 60 * 60 * 1000, 30_000 * (2 ** Math.min(attempts - 1, 10)));
      await prisma.emailOutbox.update({
        where: { id: job.id },
        data: {
          status: attempts >= MAX_ATTEMPTS ? 'FAILED' : 'PENDING',
          lockedAt: null,
          nextAttemptAt: new Date(Date.now() + delayMs),
          lastError: error instanceof Error ? error.message.slice(0, 500) : 'Email delivery failed.',
        },
      });
      failed += 1;
    }
  }
  return { considered: candidates.length, sent, failed };
}