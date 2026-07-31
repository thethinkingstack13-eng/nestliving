'use client';

import { useState, type FormEvent } from 'react';
import { Mail, Check } from 'lucide-react';
import { updateProfileSchema } from '@/lib/validations';

interface AccountSettingsFormProps {
  initialName: string;
  email: string;
  role: string;
}

export default function AccountSettingsForm({
  initialName,
  email,
  role,
}: AccountSettingsFormProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedJustNow, setSavedJustNow] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSavedJustNow(false);

    const result = updateProfileSchema.safeParse({ name });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Invalid input.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? 'Could not save changes.');
      }

      setSavedJustNow(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="divide-y divide-black">
      <div className="p-5">
        <label htmlFor="name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-black bg-[#FAFAFA] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        {error && <p className="mt-1.5 text-xs font-medium text-[#E11D48]">{error}</p>}
      </div>

      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Email</p>
        <div className="mt-0.5 flex items-center gap-1.5 text-sm font-medium">
          <Mail size={13} strokeWidth={2} className="text-neutral-500" />
          {email}
        </div>
        <p className="mt-1 text-xs text-neutral-400">
          Email can&apos;t be changed here yet.
        </p>
      </div>

      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Account Type</p>
        <p className="mt-0.5 text-sm font-medium">{role}</p>
      </div>

      <div className="flex items-center justify-end gap-3 p-5">
        {savedJustNow && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <Check size={14} strokeWidth={2.5} />
            Saved
          </span>
        )}
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-full bg-black px-5 py-2.5 text-xs font-bold tracking-wide text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'SAVING…' : 'SAVE CHANGES'}
        </button>
      </div>
    </form>
  );
}
