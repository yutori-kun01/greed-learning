/**
 * Who may create an account.
 *
 * Signup is closed unless one of these holds:
 * - the address is BOOTSTRAP_ADMIN_EMAIL (so the operator can always get in),
 * - the browser entered the current signup passcode (see signupPass.ts).
 *
 * Email/password and Google signups both create users through the same hook,
 * so this covers both.
 */

type SignupEnv = {
  BOOTSTRAP_ADMIN_EMAIL?: string;
};

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

export function isSignupAllowed(
  email: string,
  env: SignupEnv,
  { hasValidPasscodePass }: { hasValidPasscodePass: boolean }
): boolean {
  const candidate = normalize(email);

  if (env.BOOTSTRAP_ADMIN_EMAIL && candidate === normalize(env.BOOTSTRAP_ADMIN_EMAIL)) return true;
  return hasValidPasscodePass;
}
