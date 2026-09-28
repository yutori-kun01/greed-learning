// Minimal transactional email sender using the Resend HTTP API (a plain
// fetch call — no SDK, no SMTP — so it works from the Workers runtime).
//
// The API key and sender come from サイト設定 when the admin has saved them
// there (the key encrypted, see secretBox.ts), otherwise from the Worker env
// (RESEND_API_KEY / RESEND_FROM_EMAIL). With neither, emails are logged
// instead of sent so local dev and unconfigured deployments don't hard-fail.

import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { siteSettings } from '@/db/schema';
import { openSecret } from '@/lib/secretBox';

export type EmailConfig = {
  apiKey: string;
  from: string;
  source: 'settings' | 'env';
};

/**
 * Reads settings directly rather than through lib/queries, which would make
 * an import cycle (auth → email → queries → session → auth).
 */
export async function getEmailConfig(): Promise<EmailConfig | null> {
  try {
    const rows = await getDb(process.env.DB as unknown as D1Database)
      .select({ key: siteSettings.resendApiKeyEnc, from: siteSettings.resendFromEmail })
      .from(siteSettings)
      .where(eq(siteSettings.id, '1'))
      .limit(1);
    const row = rows[0];
    const apiKey = await openSecret(row?.key, process.env.BETTER_AUTH_SECRET ?? '');
    if (apiKey && row?.from) return { apiKey, from: row.from, source: 'settings' };
  } catch (err) {
    console.error('[email] Could not read email settings; falling back to env.', err);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  return apiKey && from ? { apiKey, from, source: 'env' } : null;
}

export type SendResult = { ok: true } | { ok: false; error: string };

/** Like sendEmail, but reports why a message was not sent. */
export async function sendEmailDetailed({ to, subject, html, replyTo }: { to: string; subject: string; html: string; replyTo?: string }): Promise<SendResult> {
  const config = await getEmailConfig();

  if (!config) {
    console.warn(`[email] Resend is not configured — not sending "${subject}" to ${to}. Set it in サイト設定 (or RESEND_API_KEY / RESEND_FROM_EMAIL).`);
    return { ok: false, error: 'メール送信（Resend）が設定されていません' };
  }

  let res: Response;
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: config.from, to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    // A mail outage must not take down the request that triggered the mail
    // (a password reset, a support message) — report it instead.
    console.error(`[email] Could not reach Resend for "${subject}" to ${to}`, err);
    return { ok: false, error: 'Resendに接続できませんでした。時間をおいて再度お試しください' };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[email] Failed to send "${subject}" to ${to}: ${res.status} ${body}`);
    let message = '';
    try {
      message = (JSON.parse(body) as { message?: string }).message ?? '';
    } catch {
      // Non-JSON error body; the status is enough.
    }
    return { ok: false, error: `Resendがエラーを返しました（${res.status}）${message ? `: ${message}` : ''}` };
  }
  return { ok: true };
}

/** Resolves true only when Resend accepted the message. */
export async function sendEmail(message: { to: string; subject: string; html: string; replyTo?: string }): Promise<boolean> {
  return (await sendEmailDetailed(message)).ok;
}
