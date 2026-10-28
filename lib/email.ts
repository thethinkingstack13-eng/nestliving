import { Resend } from 'resend';
import nodemailer from 'nodemailer';
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

// [SMTP] When SMTP_* variables are set we send through SMTP (Gmail, Brevo...).
// This works WITHOUT owning a domain, unlike Resend's onboarding sender which
// only delivers to the Resend account owner's own address.
// If SMTP is not configured we fall back to the original Resend path.
function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function sendViaSmtp({ to, subject, html }: SendEmailArgs): Promise<void> {
  const port = Number(process.env.SMTP_PORT ?? 465);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 = TLS from the first byte; 587 = starts plain then upgrades (STARTTLS).
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    // Short timeouts so a stuck SMTP server can't hang a serverless function.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  await transporter.sendMail({
    // Gmail always rewrites "from" to the authenticated account anyway.
    from: process.env.EMAIL_FROM ?? `NestLiving <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  });
}

export async function sendEmail({ to, subject, html }: SendEmailArgs): Promise<void> {
  // SMTP first (if configured).
  if (smtpConfigured()) {
    await sendViaSmtp({ to, subject, html });
    return;
  }

  // ---- original Resend path (unchanged) ----
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
      <h1 style="font-size: 22px;">Verify your NestLiving email</h1>
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

export interface BookingRequestEmailDetails {
  ownerName: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone?: string | null;
  occupation?: string | null;
  budget?: string | null;
  preferredLocation?: string | null;
  bio?: string | null;
  roomTitle: string;
  moveInDate: string;
  requestedAt: string;
  message?: string | null;
  dashboardUrl: string;
}

export function bookingRequestEmailHtml(d: BookingRequestEmailDetails): string {
  const row = (label: string, value?: string | null) =>
    value
      ? `<tr><td style="padding:6px 14px 6px 0;color:#666;vertical-align:top;">${label}</td><td style="padding:6px 0;"><strong>${escapeHtml(value)}</strong></td></tr>`
      : '';
  return `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
      <p style="font-weight: bold;">// NestLiving</p>
      <h1 style="font-size: 22px;">New booking request</h1>
      <p>Hi ${escapeHtml(d.ownerName)}, ${escapeHtml(d.tenantName)} has requested <strong>${escapeHtml(d.roomTitle)}</strong>.</p>
      <table style="border-collapse: collapse; font-size: 14px;">
        ${row('Name', d.tenantName)}${row('Phone', d.tenantPhone)}${row('Email', d.tenantEmail)}
        ${row('Occupation', d.occupation)}${row('Budget', d.budget)}${row('Preferred area', d.preferredLocation)}
        ${row('Move-in', d.moveInDate)}${row('Requested on', d.requestedAt)}${row('Message', d.message)}${row('About', d.bio)}
      </table>
      <p><a href="${escapeHtml(d.dashboardUrl)}">Review and approve or reject</a></p>
    </div>
  `;
}

export function bookingDecisionEmailHtml(d: {
  tenantName: string;
  roomTitle: string;
  approved: boolean;
  ownerName?: string | null;
  ownerPhone?: string | null;
  address?: string | null;
  dashboardUrl: string;
}): string {
  const details = d.approved
    ? `<p>The owner accepted your request. Contact details:</p>
       <p><strong>${escapeHtml(d.ownerName ?? 'Owner')}</strong><br/>
       ${d.ownerPhone ? `Phone: <strong>${escapeHtml(d.ownerPhone)}</strong><br/>` : ''}
       ${d.address ? `Address: ${escapeHtml(d.address)}` : ''}</p>`
    : `<p>The owner could not accept this request. You can send requests for other rooms.</p>`;
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <p style="font-weight: bold;">// NestLiving</p>
      <h1 style="font-size: 22px;">${d.approved ? 'Request accepted' : 'Request update'}</h1>
      <p>Hi ${escapeHtml(d.tenantName)}, your request for <strong>${escapeHtml(d.roomTitle)}</strong> was ${d.approved ? 'accepted' : 'declined'}.</p>
      ${details}
      <p><a href="${escapeHtml(d.dashboardUrl)}">Open your dashboard</a></p>
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
