import { Resend } from 'resend';

// Resend's shared "onboarding@resend.dev" sender works immediately with
// no domain verification -- perfect for getting real email delivery
// working before you own a custom domain. Swap this for
// "notifications@yourdomain.com" once you verify a domain in Resend.
const FROM_ADDRESS = 'NestLiving <onboarding@resend.dev>';

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('RESEND_API_KEY is not set; skipping outbound email delivery in development mode.');
      return null;
    }
    throw new Error('RESEND_API_KEY is not set. Add it to your .env file.');
  }
  return new Resend(apiKey);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character);
}

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailArgs): Promise<void> {
  const resend = getClient();
  if (!resend) return;

  const result = await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });
  if (result.error) throw new Error(result.error.message);
}

export function welcomeEmailHtml(name: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <p style="font-weight: bold; letter-spacing: -0.5px;">// NestLiving</p>
      <h1 style="font-size: 22px;">Welcome, ${escapeHtml(name)}!</h1>
      <p style="color: #444; line-height: 1.6;">
        Your account is ready. Start browsing verified rooms or find a
        compatible roommate whenever you're ready.
      </p>
    </div>
  `;
}

export function emailVerificationHtml(name: string, verificationUrl: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <p style="font-weight: bold;">// NestLiving</p>
      <h1 style="font-size: 22px;">Verify your email</h1>
      <p>Hi ${escapeHtml(name)}, confirm this address to activate your account.</p>
      <p><a href="${escapeHtml(verificationUrl)}">Verify email address</a></p>
      <p>If you did not create this account, ignore this message.</p>
    </div>
  `;
}

export function passwordResetHtml(resetUrl: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <p style="font-weight: bold;">// NestLiving</p>
      <h1 style="font-size: 22px;">Reset your password</h1>
      <p><a href="${escapeHtml(resetUrl)}">Choose a new password</a></p>
      <p>This link expires in 30 minutes. If you did not request a reset, ignore this message.</p>
    </div>
  `;
}

export function bookingRequestEmailHtml(ownerName: string, tenantName: string, roomTitle: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <p style="font-weight: bold; letter-spacing: -0.5px;">// NestLiving</p>
      <h1 style="font-size: 22px;">New booking request</h1>
      <p style="color: #444; line-height: 1.6;">
        Hi ${escapeHtml(ownerName)}, ${escapeHtml(tenantName)} just requested to book
        <strong>${escapeHtml(roomTitle)}</strong>. Log in to your dashboard to approve
        or reject the request.
      </p>
    </div>
  `;
}

// Ready to use once real roommate-match notifications exist (Phase 9).
export function roommateMatchEmailHtml(tenantName: string, matchName: string, score: number): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <p style="font-weight: bold; letter-spacing: -0.5px;">// NestLiving</p>
      <h1 style="font-size: 22px;">New ${score}% compatible match</h1>
      <p style="color: #444; line-height: 1.6;">
        Hi ${escapeHtml(tenantName)}, ${escapeHtml(matchName)} is a ${Math.max(0, Math.min(100, Math.round(score)))}% lifestyle match for
        you. Log in to view their profile and send a connect request.
      </p>
    </div>
  `;
}
