'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';

export default function BookingRequestButton({ roomId }: { roomId: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [moveInDate, setMoveInDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().slice(0, 10);
  });

  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSending(true);
    setError(null);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          moveInDate: new Date(`${moveInDate}T12:00:00.000Z`).toISOString(),
          message,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message ?? 'Could not send your request.');
      setIsOpen(false);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not send your request.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) {
    return (
      <button type="button" onClick={() => setIsOpen(true)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-bold tracking-wide text-white transition-colors hover:bg-neutral-800">
        REQUEST THIS ROOM <ArrowUpRight size={16} strokeWidth={2.5} />
      </button>
    );
  }

  return (
    <form onSubmit={submitRequest} className="mt-5 space-y-3 border-t border-black pt-4">
      <label className="block text-xs font-semibold uppercase tracking-wide">
        Move-in date
        <input type="date" required min={new Date().toISOString().slice(0, 10)} value={moveInDate} onChange={(event) => setMoveInDate(event.target.value)} className="mt-1 w-full border border-black px-3 py-2 text-sm font-normal normal-case" />
      </label>
      <label className="block text-xs font-semibold uppercase tracking-wide">
        Note to owner
        <textarea maxLength={1000} rows={2} value={message} onChange={(event) => setMessage(event.target.value)} className="mt-1 w-full border border-black px-3 py-2 text-sm font-normal normal-case" />
      </label>
      {error && <p role="alert" className="text-xs text-[#E11D48]">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={isSending} className="flex-1 bg-black px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{isSending ? 'SENDING…' : 'SEND REQUEST'}</button>
        <button type="button" onClick={() => setIsOpen(false)} className="border border-black px-3 py-2 text-xs font-bold">CANCEL</button>
      </div>
    </form>
  );
}