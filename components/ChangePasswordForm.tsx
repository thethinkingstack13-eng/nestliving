'use client';

import { useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import { changePasswordSchema, type ChangePasswordValues } from '@/lib/validations';

type FieldErrors = Partial<Record<keyof ChangePasswordValues, string>>;

const INITIAL_STATE: ChangePasswordValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export default function ChangePasswordForm() {
  const [formData, setFormData] = useState<ChangePasswordValues>(INITIAL_STATE);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedJustNow, setSavedJustNow] = useState(false);

  const updateField = (field: keyof ChangePasswordValues, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    setSavedJustNow(false);

    const result = changePasswordSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof ChangePasswordValues;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? 'Could not update password.');
      }

      setFormData(INITIAL_STATE);
      setSavedJustNow(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-5">
      <div>
        <label htmlFor="currentPassword" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Current Password
        </label>
        <input
          id="currentPassword"
          type="password"
          value={formData.currentPassword}
          onChange={(e) => updateField('currentPassword', e.target.value)}
          className="w-full border border-black bg-[#FAFAFA] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        {errors.currentPassword && (
          <p className="mt-1.5 text-xs font-medium text-[#E11D48]">{errors.currentPassword}</p>
        )}
      </div>

      <div className="mt-4">
        <label htmlFor="newPassword" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
          New Password
        </label>
        <input
          id="newPassword"
          type="password"
          value={formData.newPassword}
          onChange={(e) => updateField('newPassword', e.target.value)}
          className="w-full border border-black bg-[#FAFAFA] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        {errors.newPassword && (
          <p className="mt-1.5 text-xs font-medium text-[#E11D48]">{errors.newPassword}</p>
        )}
      </div>

      <div className="mt-4">
        <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Confirm New Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => updateField('confirmPassword', e.target.value)}
          className="w-full border border-black bg-[#FAFAFA] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        {errors.confirmPassword && (
          <p className="mt-1.5 text-xs font-medium text-[#E11D48]">{errors.confirmPassword}</p>
        )}
      </div>

      {submitError && (
        <p className="mt-3 text-xs font-medium text-[#E11D48]">{submitError}</p>
      )}

      <div className="mt-5 flex items-center justify-end gap-3">
        {savedJustNow && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <Check size={14} strokeWidth={2.5} />
            Password updated
          </span>
        )}
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-full bg-black px-5 py-2.5 text-xs font-bold tracking-wide text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'UPDATING…' : 'UPDATE PASSWORD'}
        </button>
      </div>
    </form>
  );
}
