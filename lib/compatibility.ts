/**
 * Roommate Compatibility Engine
 * ------------------------------------------------------------------
 * Pure, deterministic scoring function used by the matching dashboard
 * (and, eventually, a background job that pre-computes match scores
 * for every tenant pair). Kept dependency-free so it can run equally
 * well in a Next.js server component, an API route, or a cron script.
 */

export type SleepSchedule = 'EARLY_BIRD' | 'NIGHT_OWL';

export interface LifestyleProfile {
  /** Self-rated tidiness, 1 (relaxed) – 5 (spotless). */
  cleanliness: number;
  /** Tolerance/preference for noise, 1 (silent) – 5 (lively). */
  noiseLevel: number;
  sleepSchedule: SleepSchedule;
  smoking: boolean;
  pets: boolean;
}

// Point deductions per mismatch type — tweak here to retune the model
// without touching the scoring logic itself.
const PENALTY_PER_CLEANLINESS_LEVEL = 10;
const PENALTY_PER_NOISE_LEVEL = 10;
const PENALTY_SCHEDULE_MISMATCH = 15;
const PENALTY_SMOKING_MISMATCH = 20;
const PENALTY_PETS_MISMATCH = 15;

const MIN_SCORE = 0;
const MAX_SCORE = 100;

/**
 * Calculates a 0–100 compatibility score between two lifestyle profiles.
 * Starts at a perfect 100 and subtracts weighted penalties for every
 * axis of mismatch. The result is clamped and rounded to an integer
 * so it can be rendered directly as "NN% MATCH".
 */
export function calculateCompatibility(
  profileA: LifestyleProfile,
  profileB: LifestyleProfile
): number {
  let score = MAX_SCORE;

  const cleanlinessDelta = Math.abs(profileA.cleanliness - profileB.cleanliness);
  score -= cleanlinessDelta * PENALTY_PER_CLEANLINESS_LEVEL;

  const noiseDelta = Math.abs(profileA.noiseLevel - profileB.noiseLevel);
  score -= noiseDelta * PENALTY_PER_NOISE_LEVEL;

  if (profileA.sleepSchedule !== profileB.sleepSchedule) {
    score -= PENALTY_SCHEDULE_MISMATCH;
  }

  if (profileA.smoking !== profileB.smoking) {
    score -= PENALTY_SMOKING_MISMATCH;
  }

  if (profileA.pets !== profileB.pets) {
    score -= PENALTY_PETS_MISMATCH;
  }

  const clamped = Math.min(MAX_SCORE, Math.max(MIN_SCORE, score));
  return Math.round(clamped);
}

/**
 * Convenience helper for UI thresholds — keeps the "what counts as a
 * strong match" definition in one place instead of duplicated magic
 * numbers across components.
 */
export function getCompatibilityTier(score: number): 'high' | 'medium' | 'low' {
  if (score >= 85) return 'high';
  if (score >= 70) return 'medium';
  return 'low';
}
