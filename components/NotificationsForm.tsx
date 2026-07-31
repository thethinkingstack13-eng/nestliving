'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { notificationPreferencesSchema, type NotificationPreferencesValues } from '@/lib/validations';

interface NotificationsFormProps {
  initialPreferences: NotificationPreferencesValues;
}

const LABELS: Record<keyof NotificationPreferencesValues, string> = {
  emailOnBookingRequests: 'Email me about new booking requests',
  emailOnRoommateMatches: 'Email me about roommate match updates',
  emailOnProductAnnouncements: 'Email me product announcements',
};

export default function NotificationsForm({ initialPreferences }: NotificationsFormProps) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedJustNow, setSavedJustNow] = useState(false);

  const toggle = async (key: keyof NotificationPreferencesValues) => {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    setError(null);
    setSavedJustNow(false);

    const result = notificationPreferencesSchema.safeParse(next);
    if (!result.success) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? 'Could not save preference.');
      }

      setSavedJustNow(true);
    } catch (err) {
      // Revert the checkbox if the save failed.
      setPreferences(preferences);
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="divide-y divide-black">
        {(Object.keys(LABELS) as Array<keyof NotificationPreferencesValues>).map((key) => (
          <label key={key} className="flex items-center justify-between p-5 text-sm">
            {LABELS[key]}
            <input
              type="checkbox"
              checked={preferences[key]}
              onChange={() => toggle(key)}
              disabled={isSaving}
              className="h-4 w-4 accent-black"
            />
          </label>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-black p-3">
        {error ? (
          <p className="text-xs font-medium text-[#E11D48]">{error}</p>
        ) : savedJustNow ? (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <Check size={13} strokeWidth={2.5} />
            Preferences saved
          </p>
        ) : (
          <p className="text-xs text-neutral-400">Changes save automatically.</p>
        )}
      </div>
    </div>
  );
}
