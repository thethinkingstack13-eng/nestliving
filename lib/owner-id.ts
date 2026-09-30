import { createCipheriv, randomBytes } from 'node:crypto';

const ENCRYPTED_PREFIX = 'enc:v1:';

function getEncryptionKey(): Buffer {
  const value = process.env.OWNER_ID_ENCRYPTION_KEY;
  if (!value || !/^[a-fA-F0-9]{64}$/.test(value)) {
    throw new Error('OWNER_ID_ENCRYPTION_KEY must be a 64-character hexadecimal key.');
  }
  return Buffer.from(value, 'hex');
}

export function isEncryptedGovernmentId(value: string): boolean {
  return value.startsWith(ENCRYPTED_PREFIX);
}

export function encryptGovernmentId(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    ENCRYPTED_PREFIX.slice(0, -1),
    iv.toString('base64url'),
    authTag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join(':');
}