/**
 * Proof that a browser entered the signup passcode.
 *
 * After the passcode check, the browser gets a short-lived cookie holding an
 * expiry and an HMAC over that expiry and a digest of the passcode. The user
 * create hook re-verifies it, so skipping the passcode screen and posting to
 * the sign-up endpoint directly does not work. Binding the passcode digest
 * means changing the passcode revokes every pass already handed out.
 *
 * Pure Web Crypto, so the same code runs in the Worker and in tests.
 */

export const SIGNUP_PASS_COOKIE = 'signup_pass';
export const SIGNUP_PASS_TTL_SECONDS = 30 * 60;

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(value: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
}

/** Compares two strings without an early exit that leaks where they differ. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Whether `attempt` matches the configured passcode (compared as digests). */
export async function passcodeMatches(attempt: string, passcode: string): Promise<boolean> {
  return timingSafeEqual(await sha256(attempt.trim()), await sha256(passcode.trim()));
}

export async function issueSignupPass(
  secret: string,
  passcode: string,
  now: number = Date.now()
): Promise<string> {
  const expiresAt = Math.floor(now / 1000) + SIGNUP_PASS_TTL_SECONDS;
  const signature = await hmac(secret, `${expiresAt}:${await sha256(passcode.trim())}`);
  return `${expiresAt}.${signature}`;
}

export async function verifySignupPass(
  token: string | undefined | null,
  secret: string,
  passcode: string | null | undefined,
  now: number = Date.now()
): Promise<boolean> {
  if (!token || !passcode) return false;
  const [expiresRaw, signature] = token.split('.');
  const expiresAt = Number(expiresRaw);
  if (!Number.isInteger(expiresAt) || !signature) return false;
  if (expiresAt < Math.floor(now / 1000)) return false;

  const expected = await hmac(secret, `${expiresAt}:${await sha256(passcode.trim())}`);
  return timingSafeEqual(signature, expected);
}

/** Pulls one cookie's value out of a raw Cookie header. */
export function readCookie(header: string | null | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}
