/**
 * Server-side Cloudflare Turnstile verification for flows that do not go
 * through Better Auth (whose captcha plugin covers sign-in and sign-up).
 *
 * With TURNSTILE_SECRET_KEY unset the check is skipped, matching the auth
 * plugin, so a deployment without Turnstile keys still works.
 */

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export function isTurnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstile(token: string | null | undefined, remoteIp?: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, ...(remoteIp ? { remoteip: remoteIp } : {}) }),
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (error) {
    // Fail closed: an unreachable verifier must not wave requests through.
    console.error('[turnstile] verification request failed', error);
    return false;
  }
}
