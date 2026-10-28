'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RoommateRequestActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answer = async (status: 'ACCEPTED' | 'DECLINED') => {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/roommate-connections/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? 'Something went wrong.');
      setBusy(false);
      return;
    }
    router.refresh();
  };

  return (
    <div>
      <div className="flex gap-2">
        <button disabled={busy} onClick={() => answer('ACCEPTED')} className="flex-1 rounded-full bg-black px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Accept</button>
        <button disabled={busy} onClick={() => answer('DECLINED')} className="flex-1 rounded-full border border-black px-4 py-2 text-xs font-bold disabled:opacity-50">Decline</button>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-[#E11D48]">{error}</p>}
    </div>
  );
}