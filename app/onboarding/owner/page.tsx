'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Phone, Building2, MapPin } from 'lucide-react';
import {
  ownerOnboardingSchema,
  type OwnerOnboardingValues,
} from '@/lib/validations';
import Navbar from '@/components/Navbar';

type FormState = {
  phone: string;
  businessName: string;
  governmentId: string;
  city: string;
  address: string;
  agreedToTerms: boolean;
};

type FieldErrors = Partial<Record<keyof OwnerOnboardingValues, string>>;

const INITIAL_STATE: FormState = {
  phone: '',
  businessName: '',
  governmentId: '',
  city: '',
  address: '',
  agreedToTerms: false,
};

export default function OwnerOnboardingPage() {
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

    const result = ownerOnboardingSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof OwnerOnboardingValues;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/onboarding/owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? 'Could not save your profile. Please try again.');
      }

      router.push('/dashboard/owner');
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
            Set up your owner profile
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Verified owner details help tenants trust your listings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8" noValidate>
          {/* Phone */}
          <div>
            <label htmlFor="phone" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide">
              Contact Phone Number
            </label>
            <div className="flex items-center border border-black bg-[#FAFAFA] px-4 focus-within:ring-2 focus-within:ring-black">
              <Phone size={16} strokeWidth={2} className="text-neutral-500" />
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-transparent px-3 py-3 text-sm focus:outline-none"
              />
            </div>
            {errors.phone && (
              <p className="mt-1.5 text-xs font-medium text-[#E11D48]">{errors.phone}</p>
            )}
          </div>

          {/* Business Name */}
          <div className="mt-6">
            <label htmlFor="businessName" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide">
              Your Name / Business Name
            </label>
            <div className="flex items-center border border-black bg-[#FAFAFA] px-4 focus-within:ring-2 focus-within:ring-black">
              <Building2 size={16} strokeWidth={2} className="text-neutral-500" />
              <input
                id="businessName"
                type="text"
                value={formData.businessName}
                onChange={(e) => updateField('businessName', e.target.value)}
                placeholder="e.g. Khan Residences"
                className="w-full bg-transparent px-3 py-3 text-sm focus:outline-none"
              />
            </div>
            {errors.businessName && (
              <p className="mt-1.5 text-xs font-medium text-[#E11D48]">{errors.businessName}</p>
            )}
          </div>

          {/* Government ID */}
          <div className="mt-6">
            <label htmlFor="governmentId" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide">
              Government ID (Aadhaar / PAN / GST)
            </label>
            <input
              id="governmentId"
              type="text"
              value={formData.governmentId}
              onChange={(e) => updateField('governmentId', e.target.value)}
              placeholder="For verification only — kept private"
              className="w-full border border-black bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            {errors.governmentId && (
              <p className="mt-1.5 text-xs font-medium text-[#E11D48]">{errors.governmentId}</p>
            )}
          </div>

          {/* City */}
          <div className="mt-6">
            <label htmlFor="city" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide">
              Primary Operating City
            </label>
            <div className="flex items-center border border-black bg-[#FAFAFA] px-4 focus-within:ring-2 focus-within:ring-black">
              <MapPin size={16} strokeWidth={2} className="text-neutral-500" />
              <input
                id="city"
                type="text"
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="Gorakhpur"
                className="w-full bg-transparent px-3 py-3 text-sm focus:outline-none"
              />
            </div>
            {errors.city && (
              <p className="mt-1.5 text-xs font-medium text-[#E11D48]">{errors.city}</p>
            )}
          </div>

          {/* Address */}
          <div className="mt-6">
            <label htmlFor="address" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide">
              Address
            </label>
            <textarea
              id="address"
              rows={3}
              value={formData.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="Full street address"
              className="w-full resize-none border border-black bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            {errors.address && (
              <p className="mt-1.5 text-xs font-medium text-[#E11D48]">{errors.address}</p>
            )}
          </div>

          {/* Terms */}
          <label className="mt-6 flex items-start gap-3 border border-black px-4 py-3">
            <input
              type="checkbox"
              checked={formData.agreedToTerms}
              onChange={(e) => updateField('agreedToTerms', e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-black"
            />
            <span className="text-xs leading-relaxed text-neutral-700">
              I agree to NestLiving&apos;s{' '}
              <span className="font-semibold text-black">Terms of Service</span> and{' '}
              <span className="font-semibold text-black">Owner Listing Policy</span>, and
              confirm the details above are accurate.
            </span>
          </label>
          {errors.agreedToTerms && (
            <p className="mt-1.5 text-xs font-medium text-[#E11D48]">{errors.agreedToTerms}</p>
          )}

          {submitError && (
            <p className="mt-4 text-xs font-medium text-[#E11D48]">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-bold tracking-wide text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'SUBMITTING…' : 'COMPLETE OWNER REGISTRATION'}
            <ArrowUpRight size={16} strokeWidth={2.5} />
          </button>
        </form>
      </div>
      </div>
    </main>
  );
}
