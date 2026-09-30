'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';

export default function VerifyEmailForm({ email, verified }: { email: string; verified?: string }) {
  const [value, setValue] = useState(email);
  const [message, setMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const resend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSending(true);
    setMessage(null);
    try {
      const response = await fetch('/api/auth/verify-email/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message ?? 'Could not resend verification email.');
      setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not resend verification email.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full max-w-md border border-black bg-white p-8 shadow-[6px_6px_0px_0px_#000000]">
      <h1 className="font-display text-2xl font-bold">Verify your email</h1>
      {verified === 'success' ? (
        <p className="mt-3 text-sm text-emerald-800">Email verified. You can now sign in.</p>
      ) : verified === 'invalid' ? (
        <p className="mt-3 text-sm text-[#E11D48]">That verification link is invalid or expired. Request a fresh link below.</p>
      ) : (
        <p className="mt-3 text-sm text-neutral-600">Enter the address used at registration to resend your activation link.</p>
      )}
      <form onSubmit={resend} className="mt-6">
        <label htmlFor="verification-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide">Email</label>
        <input id="verification-email" type="email" required value={value} onChange={(event) => setValue(event.target.value)} className="w-full border border-black px-3 py-3 text-sm" />
        {message && <p role="status" className="mt-3 text-sm text-neutral-700">{message}</p>}
        <button type="submit" disabled={isSending} className="mt-5 w-full bg-black px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{isSending ? 'SENDING…' : 'RESEND VERIFICATION EMAIL'}</button>
      </form>
      <Link href="/auth/login" className="mt-5 inline-block text-sm font-semibold underline">Back to sign in</Link>
    </div>
  );
}