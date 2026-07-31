import { z } from 'zod';

// ---------------------------------------------
// Auth — Registration
// ---------------------------------------------

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['TENANT', 'OWNER'], {
    errorMap: () => ({ message: 'Select whether you are a tenant or an owner' }),
  }),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

// ---------------------------------------------
// Onboarding — Tenant lifestyle profile
// ---------------------------------------------

export const tenantOnboardingSchema = z
  .object({
    preferredLocation: z.string().min(2, 'Enter a preferred location'),
    budgetMin: z.coerce.number().int().nonnegative('Enter a valid minimum rent'),
    budgetMax: z.coerce.number().int().positive('Enter a valid maximum rent'),
    cleanliness: z.number().int().min(1).max(5),
    noisePreference: z.number().int().min(1).max(5),
    sleepSchedule: z.enum(['EARLY_BIRD', 'NIGHT_OWL']),
    smokingAllowed: z.boolean(),
    petsFriendly: z.boolean(),
    bio: z.string().max(500, 'Bio must be under 500 characters').optional(),
  })
  .refine((data) => data.budgetMax >= data.budgetMin, {
    message: 'Max rent must be greater than or equal to min rent',
    path: ['budgetMax'],
  });

export type TenantOnboardingValues = z.infer<typeof tenantOnboardingSchema>;

// ---------------------------------------------
// Onboarding — Owner profile
// ---------------------------------------------

export const ownerOnboardingSchema = z.object({
  phone: z
    .string()
    .min(10, 'Enter a valid phone number')
    .max(15, 'Enter a valid phone number'),
  businessName: z.string().min(2, 'Enter your name or business name'),
  governmentId: z.string().min(4, 'Enter a valid government ID number'),
  city: z.string().min(2, 'Enter your primary operating city'),
  address: z.string().min(5, 'Enter a valid address'),
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the terms to continue' }),
  }),
});

export type OwnerOnboardingValues = z.infer<typeof ownerOnboardingSchema>;

// ---------------------------------------------
// Settings — profile info & password change
// ---------------------------------------------

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export type UpdateProfileValues = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Re-enter your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export const notificationPreferencesSchema = z.object({
  emailOnBookingRequests: z.boolean(),
  emailOnRoommateMatches: z.boolean(),
  emailOnProductAnnouncements: z.boolean(),
});

export type NotificationPreferencesValues = z.infer<typeof notificationPreferencesSchema>;
