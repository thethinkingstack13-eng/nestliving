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
  // An email provider is "configured" if EITHER Resend OR SMTP credentials exist.
  const hasEmailProvider =
    Boolean(process.env.RESEND_API_KEY) ||
    Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

  if (requirements.emailProvider && process.env.NODE_ENV !== 'development' && !hasEmailProvider) {
    missing.push('RESEND_API_KEY or SMTP_HOST/SMTP_USER/SMTP_PASS');
  }
  return missing;
}