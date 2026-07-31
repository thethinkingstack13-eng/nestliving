'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="flex items-center gap-2 rounded-full border border-black bg-white px-5 py-2.5 text-xs font-bold tracking-wide text-[#E11D48] transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <LogOut size={14} strokeWidth={2.5} />
      {isLoggingOut ? 'LOGGING OUT…' : 'LOG OUT'}
    </button>
  );
}
