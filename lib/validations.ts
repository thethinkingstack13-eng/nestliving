import { z } from 'zod';

// ---------------------------------------------
// Auth — Registration
// ---------------------------------------------

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().trim().email('Enter a valid email address').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
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
    occupation: z.string().max(80).optional(),
    avatarUrl: z.string().url().optional().or(z.literal('')),
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
    currentPassword: z.string().min(1, 'Enter your current password').max(128),
    newPassword: z.string().min(8, 'New password must be at least 8 characters').max(128),
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

export const createPropertySchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().max(2000).optional(),
  address: z.string().trim().min(5).max(200),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  roomType: z.enum(['PRIVATE', 'SHARED']),
  totalBeds: z.number().int().min(1).max(50),
  rentPerMonth: z.number().int().positive().max(10_000_000),
  depositAmount: z.number().int().nonnegative().max(100_000_000),
  availabilityDate: z.string().datetime(),
  genderPreference: z.enum(['MALE', 'FEMALE', 'ANY']),
  amenities: z.array(z.string().trim().min(1).max(40)).max(20),
  imageUrls: z.array(z.string().url()).min(1).max(8),
});

export const createBookingSchema = z.object({
  roomId: z.string().regex(/^[a-f\d]{24}$/i),
  moveInDate: z.string().datetime(),
  message: z.string().trim().max(1000).optional(),
});

export const bookingDecisionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});
