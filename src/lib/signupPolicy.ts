/**
 * Who may create an account.
 *
 * Signup is closed unless one of these holds:
 * - the address is BOOTSTRAP_ADMIN_EMAIL (so the operator can always get in),
 * - the browser entered the current signup passcode (see signupPass.ts),
 * - the person signed in through Akinai hub and has bought something there.
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
  { hasValidPasscodePass, isAkinaiBuyer = false }: { hasValidPasscodePass: boolean; isAkinaiBuyer?: boolean }
): boolean {
  const candidate = normalize(email);

  if (env.BOOTSTRAP_ADMIN_EMAIL && candidate === normalize(env.BOOTSTRAP_ADMIN_EMAIL)) return true;
  return hasValidPasscodePass || isAkinaiBuyer;
}
