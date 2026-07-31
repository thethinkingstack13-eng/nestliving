'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { z } from 'zod';
import Navbar from '@/components/Navbar';

// Kept local to this file since login only needs 2 fields — no need
// to share with the bigger schemas in lib/validations.ts.
const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type FieldErrors = Partial<Record<keyof LoginFormValues, string>>;

const INITIAL_STATE: LoginFormValues = { email: '', password: '' };

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormValues>(INITIAL_STATE);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateField = <K extends keyof LoginFormValues>(
    field: K,
    value: LoginFormValues[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof LoginFormValues;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? 'Invalid email or password.');
      }

      const user = await res.json();
      if (user.role === 'OWNER') {
        router.push('/dashboard/owner');
      } else if (user.role === 'ADMIN') {
        router.push('/dashboard/admin');
      } else {
        router.push('/dashboard/tenant');
      }
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
        <div className="border-b border-black p-8">
          <p className="font-mono text-sm font-bold tracking-tight">// NestLiving</p>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-neutral-600">Log in to your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8" noValidate>
          <div>
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

          <div className="mt-4">
            <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => updateField('password', e.target.value)}
              placeholder="Your password"
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
            {isSubmitting ? 'LOGGING IN…' : 'LOG IN'}
            <ArrowUpRight size={16} strokeWidth={2.5} />
          </button>

          <p className="mt-6 text-center text-sm text-neutral-600">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="font-semibold text-black underline underline-offset-2">
              Create one
            </Link>
          </p>
        </form>
      </div>
      </div>
    </main>
  );
}
