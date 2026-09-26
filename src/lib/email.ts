// Minimal transactional email sender using the Resend HTTP API (a plain
// fetch call — no SDK, no SMTP — so it works from the Workers runtime).
// If RESEND_API_KEY isn't configured, emails are logged instead of sent so
// local dev and unconfigured deployments don't hard-fail; operators need to
// set RESEND_API_KEY / RESEND_FROM_EMAIL for password reset, email change
// confirmation, etc. to actually reach users.

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  /** Lets the operator reply straight to the member who wrote in. */
  replyTo?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.warn(`[email] RESEND_API_KEY/RESEND_FROM_EMAIL not configured — not sending "${subject}" to ${to}. Set these secrets to enable transactional email.`);
    return { sent: false as const, reason: 'not-configured' as const };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[email] Failed to send "${subject}" to ${to}: ${res.status} ${body}`);
    return { sent: false as const, reason: 'send-failed' as const };
  }

  return { sent: true as const };
}

/** User-supplied text goes into an HTML email body, so escape it. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
