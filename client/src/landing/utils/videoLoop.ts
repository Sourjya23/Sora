export function computeVideoLoopOpacity(
  currentTime: number,
  duration: number,
  fadeDuration = 0.5
): number {
  if (!Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 0) {
    return 0;
  }

  const safeFade = Math.max(0.01, Math.min(fadeDuration, duration / 2));
  const clampedTime = Math.max(0, Math.min(currentTime, duration));

  if (clampedTime < safeFade) {
    return Number((clampedTime / safeFade).toFixed(4));
  }

  const timeRemaining = duration - clampedTime;
  if (timeRemaining < safeFade) {
    return Number(Math.max(0, timeRemaining / safeFade).toFixed(4));
  }

  return 1;
}

export interface BookingFormInput {
  name: string;
  email: string;
  targetCompany: string;
  track: string;
}

export interface BookingFormValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof BookingFormInput, string>>;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateBookingForm(input: BookingFormInput): BookingFormValidationResult {
  const errors: Partial<Record<keyof BookingFormInput, string>> = {};

  if (!input.name.trim() || input.name.trim().length < 2) {
    errors.name = 'Please enter your full name (at least 2 characters).';
  }

  if (!input.email.trim()) {
    errors.email = 'Please enter your email address.';
  } else if (!EMAIL_PATTERN.test(input.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!input.targetCompany.trim()) {
    errors.targetCompany = 'Please select a target engineering team.';
  }

  if (!input.track.trim()) {
    errors.track = 'Please select an interview track.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
