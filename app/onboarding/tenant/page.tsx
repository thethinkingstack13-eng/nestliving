'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, MapPin, Sunrise, Moon } from 'lucide-react';
import {
  tenantOnboardingSchema,
  type TenantOnboardingValues,
} from '@/lib/validations';
import Navbar from '@/components/Navbar';
import ImageUploader from '@/components/ImageUploader';

type FormState = {
  preferredLocation: string;
  budgetMin: string;
  budgetMax: string;
  cleanliness: number;
  noisePreference: number;
  sleepSchedule: 'EARLY_BIRD' | 'NIGHT_OWL' | null;
  smokingAllowed: boolean;
  petsFriendly: boolean;
  bio: string;
  occupation: string;
  avatarUrl: string;
};

type FieldErrors = Partial<Record<keyof TenantOnboardingValues, string>>;

const INITIAL_STATE: FormState = {
  preferredLocation: '',
  budgetMin: '',
  budgetMax: '',
  cleanliness: 3,
  noisePreference: 3,
  sleepSchedule: null,
  smokingAllowed: false,
  petsFriendly: false,
  bio: '',
  occupation: '',
  avatarUrl: '',
};

function ScaleSelector({
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  lowLabel: string;
  highLabel: string;
}) {
  return (
    <div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-pressed={value === n}
            aria-label={`${n} out of 5`}
            className={`flex h-10 w-10 items-center justify-center border border-black text-sm font-bold transition-colors ${
              value === n ? 'bg-black text-white' : 'bg-[#FAFAFA] hover:bg-neutral-100'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] font-medium uppercase tracking-wide text-neutral-500">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

export default function TenantOnboardingPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    const result = tenantOnboardingSchema.safeParse({
      ...formData,
      budgetMin: formData.budgetMin,
      budgetMax: formData.budgetMax,
    });

    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof TenantOnboardingValues;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/onboarding/tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? 'Could not save your profile. Please try again.');
      }

      router.push('/dashboard/tenant');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <div className="flex justify-center px-4 py-16">
      <div className="mx-auto w-full max-w-2xl border border-black bg-[#FAFAFA] shadow-[6px_6px_0px_0px_#000000]">
        <div className="border-b border-black p-8">
          <h1 className="font-display text-3xl font-bold leading-tight">
            Tell us how you live
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            These details power your roommate match score — the more honest, the better.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8" noValidate>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide">Profile photo</p>
            <ImageUploader
              purpose="avatar"
              imageUrls={formData.avatarUrl ? [formData.avatarUrl] : []}
              onChange={(imageUrls) => updateField('avatarUrl', imageUrls[0] ?? '')}
            />
          </div>

          <div className="mt-6">
            <label htmlFor="occupation" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide">
              Occupation or study
            </label>
            <input
              id="occupation"
              type="text"
              maxLength={80}
              value={formData.occupation}
              onChange={(event) => updateField('occupation', event.target.value)}
              placeholder="e.g. Graduate student"
              className="w-full border border-black bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Preferred Location */}
          <div>
            <label htmlFor="preferredLocation" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide">
              Preferred Location
            </label>
            <div className="flex items-center border border-black bg-[#FAFAFA] px-4 focus-within:ring-2 focus-within:ring-black">
              <MapPin size={16} strokeWidth={2} className="text-neutral-500" />
              <input
                id="preferredLocation"
                type="text"
                value={formData.preferredLocation}
                onChange={(e) => updateField('preferredLocation', e.target.value)}
                placeholder="e.g. Sector 12, Gorakhpur"
                className="w-full bg-transparent px-3 py-3 text-sm focus:outline-none"
              />
            </div>
            {errors.preferredLocation && (
              <p className="mt-1.5 text-xs font-medium text-[#E11D48]">{errors.preferredLocation}</p>
            )}
          </div>

          {/* Budget Range */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="budgetMin" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide">
                Min Rent (₹/mo)
              </label>
              <input
                id="budgetMin"
                type="number"
                inputMode="numeric"
                value={formData.budgetMin}
                onChange={(e) => updateField('budgetMin', e.target.value)}
                placeholder="5000"
                className="w-full border border-black bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              {errors.budgetMin && (
                <p className="mt-1.5 text-xs font-medium text-[#E11D48]">{errors.budgetMin}</p>
              )}
            </div>
            <div>
              <label htmlFor="budgetMax" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide">
                Max Rent (₹/mo)
              </label>
              <input
                id="budgetMax"
                type="number"
                inputMode="numeric"
                value={formData.budgetMax}
                onChange={(e) => updateField('budgetMax', e.target.value)}
                placeholder="12000"
                className="w-full border border-black bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              {errors.budgetMax && (
                <p className="mt-1.5 text-xs font-medium text-[#E11D48]">{errors.budgetMax}</p>
              )}
            </div>
          </div>

          {/* Cleanliness */}
          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide">Cleanliness Rating</p>
            <ScaleSelector
              value={formData.cleanliness}
              onChange={(v) => updateField('cleanliness', v)}
              lowLabel="Relaxed"
              highLabel="Spotless"
            />
          </div>

          {/* Noise Preference */}
          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide">Noise Preference</p>
            <ScaleSelector
              value={formData.noisePreference}
              onChange={(v) => updateField('noisePreference', v)}
              lowLabel="Silent"
              highLabel="Lively"
            />
          </div>

          {/* Sleep Schedule */}
          <fieldset className="mt-6">
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide">Sleep Schedule</legend>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateField('sleepSchedule', 'EARLY_BIRD')}
                aria-pressed={formData.sleepSchedule === 'EARLY_BIRD'}
                className={`flex items-center justify-center gap-2 border border-black px-4 py-3 text-xs font-bold transition-colors ${
                  formData.sleepSchedule === 'EARLY_BIRD'
                    ? 'bg-black text-white'
                    : 'bg-[#FAFAFA] hover:bg-neutral-100'
                }`}
              >
                <Sunrise size={16} strokeWidth={2} />
                Early Bird
              </button>
              <button
                type="button"
                onClick={() => updateField('sleepSchedule', 'NIGHT_OWL')}
                aria-pressed={formData.sleepSchedule === 'NIGHT_OWL'}
                className={`flex items-center justify-center gap-2 border border-black px-4 py-3 text-xs font-bold transition-colors ${
                  formData.sleepSchedule === 'NIGHT_OWL'
                    ? 'bg-black text-white'
                    : 'bg-[#FAFAFA] hover:bg-neutral-100'
                }`}
              >
                <Moon size={16} strokeWidth={2} />
                Night Owl
              </button>
            </div>
            {errors.sleepSchedule && (
              <p className="mt-1.5 text-xs font-medium text-[#E11D48]">{errors.sleepSchedule}</p>
            )}
          </fieldset>

          {/* Lifestyle checkboxes */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2.5 border border-black px-4 py-3 text-xs font-semibold">
              <input
                type="checkbox"
                checked={formData.smokingAllowed}
                onChange={(e) => updateField('smokingAllowed', e.target.checked)}
                className="h-4 w-4 accent-black"
              />
              Smoking Allowed
            </label>
            <label className="flex items-center gap-2.5 border border-black px-4 py-3 text-xs font-semibold">
              <input
                type="checkbox"
                checked={formData.petsFriendly}
                onChange={(e) => updateField('petsFriendly', e.target.checked)}
                className="h-4 w-4 accent-black"
              />
              Pets Friendly
            </label>
          </div>

          {/* Bio */}
          <div className="mt-6">
            <label htmlFor="bio" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide">
              Short Bio
            </label>
            <textarea
              id="bio"
              rows={4}
              value={formData.bio}
              onChange={(e) => updateField('bio', e.target.value)}
              placeholder="A little about you, your routine, and what you're looking for in a home…"
              className="w-full resize-none border border-black bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            <div className="mt-1 flex justify-between">
              {errors.bio ? (
                <p className="text-xs font-medium text-[#E11D48]">{errors.bio}</p>
              ) : (
                <span />
              )}
              <span className="text-xs text-neutral-400">{formData.bio.length}/500</span>
            </div>
          </div>

          {submitError && (
            <p className="mt-4 text-xs font-medium text-[#E11D48]">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-bold tracking-wide text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'SAVING PROFILE…' : 'SAVE PROFILE & DISCOVER MATCHES'}
            <ArrowUpRight size={16} strokeWidth={2.5} />
          </button>
        </form>
      </div>
      </div>
    </main>
  );
}
