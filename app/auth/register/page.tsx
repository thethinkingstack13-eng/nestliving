'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Home, User } from 'lucide-react';
import { registerSchema, type RegisterFormValues } from '@/lib/validations';
import Navbar from '@/components/Navbar';

type FieldErrors = Partial<Record<keyof RegisterFormValues, string>>;

const INITIAL_STATE: RegisterFormValues = {
  fullName: '',
  email: '',
  password: '',
  role: 'TENANT',
};

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterFormValues>(INITIAL_STATE);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateField = <K extends keyof RegisterFormValues>(
    field: K,
    value: RegisterFormValues[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear the field-level error as soon as the user edits it
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    const result = registerSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof RegisterFormValues;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? 'Registration failed. Please try again.');
      }

      router.push(`/auth/verify-email?email=${encodeURIComponent(result.data.email)}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#FAFAFA]">
      <Navbar />
      <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md border border-black bg-[#FAFAFA] shadow-[6px_6px_0px_0px_#000000]">
        {/* Card header */}
        <div className="border-b border-black p-8">
          <p className="font-mono text-sm font-bold tracking-tight">// NestLiving</p>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Join verified tenants and owners in minutes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8" noValidate>
          {/* Role toggle */}
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              I am a
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateField('role', 'TENANT')}
                aria-pressed={formData.role === 'TENANT'}
                className={`flex flex-col items-center gap-2 border border-black px-4 py-4 text-center transition-colors ${
                  formData.role === 'TENANT'
                    ? 'bg-black text-white'
                    : 'bg-[#FAFAFA] text-black hover:bg-neutral-100'
                }`}
              >
                <User size={18} strokeWidth={2} />
                <span className="text-xs font-bold leading-tight">
                  Looking for Room /
                  <br />
                  Roommate (Tenant)
                </span>
              </button>

              <button
                type="button"
                onClick={() => updateField('role', 'OWNER')}
                aria-pressed={formData.role === 'OWNER'}
                className={`flex flex-col items-center gap-2 border border-black px-4 py-4 text-center transition-colors ${
                  formData.role === 'OWNER'
                    ? 'bg-black text-white'
                    : 'bg-[#FAFAFA] text-black hover:bg-neutral-100'
                }`}
              >
                <Home size={18} strokeWidth={2} />
                <span className="text-xs font-bold leading-tight">
                  Listing Property
                  <br />
                  (Owner)
                </span>
              </button>
            </div>
            {errors.role && (
              <p className="mt-2 text-xs font-medium text-[#E11D48]">{errors.role}</p>
            )}
          </fieldset>

          {/* Full Name */}
          <div className="mt-6">
            <label htmlFor="fullName" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              placeholder="Anam Khan"
              className="w-full border border-black bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            {errors.fullName && (
              <p className="mt-1.5 text-xs font-medium text-[#E11D48]">{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div className="mt-4">
            <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-black bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            {errors.email && (
              <p className="mt-1.5 text-xs font-medium text-[#E11D48]">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="mt-4">
            <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide">
              Password
            </label>
            <input
              id="password"
              type="password"
              maxLength={128}
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              placeholder="At least 8 characters"
              className="w-full border border-black bg-[#FAFAFA] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            {errors.password && (
              <p className="mt-1.5 text-xs font-medium text-[#E11D48]">{errors.password}</p>
            )}
          </div>

          {submitError && (
            <p className="mt-4 text-xs font-medium text-[#E11D48]">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-bold tracking-wide text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'CREATING ACCOUNT…' : 'CREATE ACCOUNT'}
            <ArrowUpRight size={16} strokeWidth={2.5} />
          </button>

          <p className="mt-6 text-center text-sm text-neutral-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-black underline underline-offset-2">
              Log in
            </Link>
          </p>
        </form>
      </div>
      </div>
    </main>
  );
}
