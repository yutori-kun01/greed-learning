'use server';

import { cookies, headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { rateLimit } from '@/db/schema';
import { getSiteSettingsQuery } from '@/lib/queries';
import { verifyTurnstile } from '@/lib/turnstile';
import {
  SIGNUP_PASS_COOKIE,
  SIGNUP_PASS_TTL_SECONDS,
  issueSignupPass,
  passcodeMatches,
} from '@/lib/signupPass';

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

export type PasscodeResult = { ok: true } | { ok: false; error: string };

const db = () => getDb(process.env.DB as unknown as D1Database);

/**
 * Counts a passcode attempt for this client and reports whether it is still
 * within the limit. Stored in D1 (the same table Better Auth's limiter uses)
 * because Worker isolates share no memory.
 */
async function withinAttemptLimit(ip: string): Promise<boolean> {
  const key = `signup-passcode:${ip}`;
  const now = Date.now();
  const rows = await db().select().from(rateLimit).where(eq(rateLimit.key, key)).limit(1);
  const row = rows[0];

  if (!row || now - row.lastRequest > WINDOW_MS) {
    if (row) {
      await db().update(rateLimit).set({ count: 1, lastRequest: now }).where(eq(rateLimit.id, row.id));
    } else {
      await db().insert(rateLimit).values({ id: crypto.randomUUID(), key, count: 1, lastRequest: now });
    }
    return true;
  }

  if (row.count >= MAX_ATTEMPTS) return false;
  await db().update(rateLimit).set({ count: row.count + 1 }).where(eq(rateLimit.id, row.id));
  return true;
}

/**
 * Checks the signup passcode and, when it matches, hands the browser a
 * short-lived signed pass that the user create hook requires.
 */
export async function enterSignupPasscode(passcode: string, turnstileToken: string | null): Promise<PasscodeResult> {
  const settings = await getSiteSettingsQuery();
  const configured = settings?.signupPasscode;
  if (!configured) {
    return { ok: false, error: '現在、新規登録は受け付けていません。' };
  }

  const reqHeaders = await headers();
  const ip = reqHeaders.get('cf-connecting-ip') ?? reqHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return { ok: false, error: 'ボット対策の確認に失敗しました。チェックをやり直してください。' };
  }
  if (!(await withinAttemptLimit(ip))) {
    return { ok: false, error: '試行回数が多すぎます。15分ほど待ってから再度お試しください。' };
  }
  if (!passcode || !(await passcodeMatches(passcode, configured))) {
    return { ok: false, error: 'パスコードが正しくありません。' };
  }

  const pass = await issueSignupPass(process.env.BETTER_AUTH_SECRET ?? '', configured);
  (await cookies()).set(SIGNUP_PASS_COOKIE, pass, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'lax',
    path: '/',
    maxAge: SIGNUP_PASS_TTL_SECONDS,
  });
  return { ok: true };
}
