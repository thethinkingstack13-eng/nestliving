'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';

interface Item {
  id: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      const data = await res.json();
      setItems(data.notifications ?? []);
      setUnread(data.unreadCount ?? 0);
    } catch {
      /* keep the previous state if the network hiccups */
    }
  }, []);

  // Load now, then every 60 seconds, and again whenever the tab regains focus.
  useEffect(() => {
    load();
    const timer = setInterval(load, 60_000);
    window.addEventListener('focus', load);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', load);
    };
  }, [load]);

  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0); // badge disappears immediately, server catches up
      await fetch('/api/notifications', { method: 'PATCH' }).catch(() => undefined);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-black"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#E11D48] px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          data-lenis-prevent
          className="fixed inset-x-4 top-[72px] z-50 max-h-[70vh] overflow-y-auto border border-black bg-[#FAFAFA] shadow-[4px_4px_0px_0px_#000000] sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-96"
        >
          <p className="border-b border-black p-4 font-display text-sm font-bold">Notifications</p>
          {items.length === 0 ? (
            <p className="p-4 text-sm text-neutral-600">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-black">
              {items.map((item) => {
                const content = (
                  <div className={`p-4 ${item.isRead ? '' : 'bg-white'}`}>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 break-words text-xs text-neutral-600">{item.body}</p>
                    <p className="mt-1 text-[11px] text-neutral-400">
                      {new Date(item.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                );
                return (
                  <li key={item.id}>
                    {item.link ? (
                      <Link href={item.link} onClick={() => setOpen(false)}>
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}