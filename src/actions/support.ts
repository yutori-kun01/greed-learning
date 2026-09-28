'use server';

import { requireUser } from '@/lib/session';
import { getSiteSettingsQuery } from '@/lib/queries';
import { sendEmail } from '@/lib/email';

const MAX_MESSAGE_LENGTH = 5000;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export type SupportResult = { ok: true } | { ok: false; error: string };

/**
 * Delivers a support message to the operator's address from site settings.
 *
 * The sender is taken from the session, not the form, so a message always
 * identifies the real account and the reply goes back to it.
 */
export async function sendSupportMessage(message: string): Promise<SupportResult> {
  const me = await requireUser();

  const body = (message ?? '').trim();
  if (!body) return { ok: false, error: 'お問い合わせ内容を入力してください' };
  if (body.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: `お問い合わせ内容は${MAX_MESSAGE_LENGTH}文字以内で入力してください` };
  }

  const settings = await getSiteSettingsQuery();
  const to = settings?.operatorEmail;
  if (!to) {
    return { ok: false, error: '問い合わせ先が未設定のため送信できません（管理画面のサイト設定でメールアドレスを登録してください）' };
  }

  const sent = await sendEmail({
    to,
    replyTo: me.email,
    subject: `[${settings?.siteName || 'お問い合わせ'}] ${me.name} 様からのお問い合わせ`,
    html: `<p>送信者: ${escapeHtml(me.name)} &lt;${escapeHtml(me.email)}&gt;</p><p>${escapeHtml(body).replace(/\n/g, '<br>')}</p>`,
  });

  if (!sent) {
    return { ok: false, error: 'メールを送信できませんでした。時間をおいて再度お試しください' };
  }
  return { ok: true };
}
