/**
 * Who may create an account.
 *
 * With ALLOWED_SIGNUP_EMAILS unset, signup is open to anyone, which is what a
 * public membership site wants. A private deployment sets it to a
 * comma-separated list of addresses and every other signup — email/password
 * and Google alike, since both create users through the same hook — is
 * refused. BOOTSTRAP_ADMIN_EMAIL is always allowed, so an operator who lists
 * nobody else still gets in.
 */

type SignupEnv = {
  ALLOWED_SIGNUP_EMAILS?: string;
  BOOTSTRAP_ADMIN_EMAIL?: string;
};

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

export function parseEmailList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map(normalize)
    .filter((email) => email.length > 0);
}

export function isSignupRestricted(env: SignupEnv): boolean {
  return parseEmailList(env.ALLOWED_SIGNUP_EMAILS).length > 0;
}

export function isSignupAllowed(email: string, env: SignupEnv): boolean {
  if (!isSignupRestricted(env)) return true;

  const candidate = normalize(email);
  const allowed = parseEmailList(env.ALLOWED_SIGNUP_EMAILS);
  const bootstrap = env.BOOTSTRAP_ADMIN_EMAIL ? normalize(env.BOOTSTRAP_ADMIN_EMAIL) : null;

  return allowed.includes(candidate) || candidate === bootstrap;
}
