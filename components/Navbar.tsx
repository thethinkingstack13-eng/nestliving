'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Menu, X, Settings, User as UserIcon, LogOut } from 'lucide-react';

const NAV_LINKS = [
  { label: 'PROGRAM', href: '/program' },
  { label: 'PRICE', href: '/price' },
  { label: 'ABOUT', href: '/about' },
  { label: 'EXPLORE ROOMS', href: '/rooms' },
  { label: 'FIND ROOMMATES', href: '/roommates' },
];

interface CurrentUser {
  id: string;
  name: string | null;
  email: string;
  role: 'TENANT' | 'OWNER' | 'ADMIN';
}

function initials(name: string | null, email: string): string {
  const source = name?.trim() || email;
  return source
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function Navbar() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  // `checked` prevents flashing the "LOG IN" button for a split second
  // before we know whether a session exists.
  const [checked, setChecked] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setUser(data.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Close the profile dropdown on outside click.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setProfileOpen(false);
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black bg-[#FAFAFA]">
      <nav className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 lg:px-10">
        {/* Logo */}
        <Link
          href="/"
          className="font-mono text-lg font-bold tracking-tight text-black"
        >
          // NestLiving
        </Link>

        {/* Middle links - desktop only */}
        <div className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-xs font-semibold tracking-wide text-black transition-colors hover:text-[#E11D48]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {checked && user ? (
            <div ref={profileMenuRef} className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                aria-expanded={profileOpen}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-black bg-neutral-200 text-xs font-bold transition-colors hover:bg-neutral-300"
              >
                {initials(user.name, user.email)}
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-12 w-64 border border-black bg-[#FAFAFA] shadow-[4px_4px_0px_0px_#000000]">
                  <div className="border-b border-black p-4">
                    <p className="font-display text-sm font-bold leading-tight">
                      {user.name ?? user.email}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">{user.email}</p>
                    <span className="mt-2 inline-flex items-center rounded-full border border-black px-2.5 py-0.5 text-[10px] font-bold">
                      {user.role}
                    </span>
                  </div>
                  <div className="flex flex-col divide-y divide-black">
                    <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium hover:bg-neutral-100"
                    >
                      <UserIcon size={15} strokeWidth={2} />
                      My Profile
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium hover:bg-neutral-100"
                    >
                      <Settings size={15} strokeWidth={2} />
                      Settings
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 px-4 py-3 text-left text-sm font-medium text-[#E11D48] hover:bg-neutral-100"
                    >
                      <LogOut size={15} strokeWidth={2} />
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="hidden items-center gap-1.5 rounded-full bg-black px-6 py-3 text-xs font-bold tracking-wide text-white transition-colors hover:bg-neutral-800 sm:inline-flex"
            >
              LOG IN
              <ArrowUpRight size={14} strokeWidth={2.5} />
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-full border border-black p-2 lg:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-black bg-[#FAFAFA] lg:hidden">
          <div className="flex flex-col divide-y divide-black">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-6 py-4 text-sm font-semibold tracking-wide text-black"
              >
                {link.label}
              </Link>
            ))}

            {checked && user ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="px-6 py-4 text-sm font-semibold tracking-wide text-black"
                >
                  MY PROFILE
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMobileOpen(false)}
                  className="px-6 py-4 text-sm font-semibold tracking-wide text-black"
                >
                  SETTINGS
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-6 py-4 text-left text-sm font-semibold tracking-wide text-[#E11D48]"
                >
                  LOG OUT
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-1.5 px-6 py-4 text-sm font-bold tracking-wide text-black"
              >
                LOG IN
                <ArrowUpRight size={14} strokeWidth={2.5} />
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
