'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';

export default function PasswordResetForm({ token }: { token?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (token && password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(token ? '/api/auth/password-reset/confirm' : '/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(token ? { token, password } : { email }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message ?? 'Could not complete password recovery.');
      setMessage(result.message);
      if (token) {
        setPassword('');
        setConfirmation('');
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not complete password recovery.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md border border-black bg-white p-8 shadow-[6px_6px_0px_0px_#000000]">
      <h1 className="font-display text-2xl font-bold">{token ? 'Choose a new password' : 'Reset your password'}</h1>
      <p className="mt-2 text-sm text-neutral-600">{token ? 'This reset link expires after 30 minutes.' : 'We will email a single-use reset link if the account exists.'}</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {token ? <>
          <label className="block text-xs font-semibold uppercase tracking-wide">New password<input type="password" minLength={8} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full border border-black px-3 py-3 text-sm font-normal normal-case" /></label>
          <label className="block text-xs font-semibold uppercase tracking-wide">Confirm password<input type="password" minLength={8} maxLength={128} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-1.5 w-full border border-black px-3 py-3 text-sm font-normal normal-case" /></label>
        </> : <label className="block text-xs font-semibold uppercase tracking-wide">Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full border border-black px-3 py-3 text-sm font-normal normal-case" /></label>}
        {message && <p role="status" className="text-sm text-neutral-700">{message}</p>}
        {error && <p role="alert" className="text-sm text-[#E11D48]">{error}</p>}
        <button type="submit" disabled={isSubmitting} className="w-full bg-black px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{isSubmitting ? 'PLEASE WAIT…' : token ? 'UPDATE PASSWORD' : 'SEND RESET LINK'}</button>
      </form>
      <Link href="/auth/login" className="mt-5 inline-block text-sm font-semibold underline">Back to sign in</Link>
    </div>
  );
}