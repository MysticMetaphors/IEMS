export const MIN_PASSWORD_LENGTH = 8;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return "Enter your email.";
  if (!EMAIL_PATTERN.test(normalizeEmail(email))) return "Enter a valid email address.";
}

/** 0 to 4, one point each for length, mixed case, a digit and a symbol. */
export function passwordStrength(password: string): number {
  return [
    password.length >= MIN_PASSWORD_LENGTH,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
}

export type RegistrationInput = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export function validateRegistration(input: RegistrationInput): FieldErrors<RegistrationInput> {
  const errors: FieldErrors<RegistrationInput> = {};

  if (!input.name.trim()) errors.name = "Enter your name.";

  const emailError = validateEmail(input.email);
  if (emailError) errors.email = emailError;

  if (input.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (input.confirmPassword !== input.password) {
    errors.confirmPassword = "Passwords don't match.";
  }

  return errors;
}

export function validateSignIn(input: { email: string; password: string }) {
  const errors: FieldErrors<typeof input> = {};

  const emailError = validateEmail(input.email);
  if (emailError) errors.email = emailError;

  if (!input.password) errors.password = "Enter your password.";

  return errors;
}
