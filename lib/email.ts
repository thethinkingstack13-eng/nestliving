import { Resend } from 'resend';

// Resend's shared "onboarding@resend.dev" sender works immediately with
// no domain verification -- perfect for getting real email delivery
// working before you own a custom domain. Swap this for
// "notifications@yourdomain.com" once you verify a domain in Resend.
const FROM_ADDRESS = 'NestLiving <onboarding@resend.dev>';

function getClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set. Add it to your .env file.');
  }
  return new Resend(apiKey);
}

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends a real email via Resend. Errors are caught and logged rather
 * than thrown -- a failed notification email should never break the
 * request that triggered it (e.g. registration should still succeed
 * even if the welcome email fails to send).
 */
export async function sendEmail({ to, subject, html }: SendEmailArgs): Promise<void> {
  try {
    const resend = getClient();
    await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

export function welcomeEmailHtml(name: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <p style="font-weight: bold; letter-spacing: -0.5px;">// NestLiving</p>
      <h1 style="font-size: 22px;">Welcome, ${name}!</h1>
      <p style="color: #444; line-height: 1.6;">
        Your account is ready. Start browsing verified rooms or find a
        compatible roommate whenever you're ready.
      </p>
    </div>
  `;
}

// Ready to use once the real booking-request API exists (Phase 9).
// Call like:
//   if (owner.emailOnBookingRequests) {
//     await sendEmail({ to: owner.email, subject: '...', html: bookingRequestEmailHtml(...) });
//   }
export function bookingRequestEmailHtml(ownerName: string, tenantName: string, roomTitle: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <p style="font-weight: bold; letter-spacing: -0.5px;">// NestLiving</p>
      <h1 style="font-size: 22px;">New booking request</h1>
      <p style="color: #444; line-height: 1.6;">
        Hi ${ownerName}, ${tenantName} just requested to book
        <strong>${roomTitle}</strong>. Log in to your dashboard to approve
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
        Hi ${tenantName}, ${matchName} is a ${score}% lifestyle match for
        you. Log in to view their profile and send a connect request.
      </p>
    </div>
  `;
}
