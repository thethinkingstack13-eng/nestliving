interface RuntimeRequirements {
  jwt?: boolean;
  outbox?: boolean;
  applicationUrl?: boolean;
  emailProvider?: boolean;
}

export function missingAuthRuntimeConfig(requirements: RuntimeRequirements = {}): string[] {
  const missing: string[] = [];
  if (!process.env.DATABASE_URL) missing.push('DATABASE_URL');
  if (requirements.jwt) {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32 || /placeholder|generate-|change-me|example/i.test(secret)) {
      missing.push('JWT_SECRET');
    }
  }
  if (requirements.outbox) {
    const key = process.env.EMAIL_OUTBOX_ENCRYPTION_KEY;
    if (!key || !/^[a-fA-F0-9]{64}$/.test(key)) missing.push('EMAIL_OUTBOX_ENCRYPTION_KEY');
  }
  if (requirements.applicationUrl && process.env.NODE_ENV === 'production' && !process.env.APP_URL) {
    missing.push('APP_URL');
  }
  if (requirements.emailProvider && process.env.NODE_ENV !== 'development' && !process.env.RESEND_API_KEY) {
    missing.push('RESEND_API_KEY');
  }
  return missing;
}