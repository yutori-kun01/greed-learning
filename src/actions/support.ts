'use server';

import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth';
import { getSiteSettings } from '@/lib/siteSettings';
import { escapeHtml, sendEmail } from '@/lib/email';

export type SupportResult = { ok: true } | { ok: false; error: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 4000;

/**
 * Sends a support enquiry to the operator address from the site settings.
 * The form used to fake a send with a timer, so enquiries were silently lost.
 */
export async function sendSupportInquiry(formData: FormData): Promise<SupportResult> {
  const reqHeaders = await headers();
  const auth = getAuth(process.env.DB as unknown as D1Database);
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session) {
    return { ok: false, error: 'ログインが必要です' };
  }

  const name = ((formData.get('name') as string) || '').trim();
  const email = ((formData.get('email') as string) || '').trim();
  const message = ((formData.get('message') as string) || '').trim();

  if (!name) return { ok: false, error: 'お名前を入力してください' };
  if (!EMAIL_PATTERN.test(email)) return { ok: false, error: 'メールアドレスの形式が正しくありません' };
  if (!message) return { ok: false, error: 'お問い合わせ内容を入力してください' };
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: `お問い合わせ内容は${MAX_MESSAGE_LENGTH}文字以内で入力してください` };
  }

  const settings = await getSiteSettings();
  const destination = settings?.operatorEmail || process.env.RESEND_FROM_EMAIL;

  if (!destination) {
    return {
      ok: false,
      error: '現在お問い合わせ先が設定されていません。お手数ですが運営者に直接ご連絡ください。',
    };
  }

  const result = await sendEmail({
    to: destination,
    replyTo: email,
    subject: `[お問い合わせ] ${name} 様より`,
    html: `
      <p>会員サイトのお問い合わせフォームから送信されました。</p>
      <table cellpadding="6">
        <tr><td><b>お名前</b></td><td>${escapeHtml(name)}</td></tr>
        <tr><td><b>返信先</b></td><td>${escapeHtml(email)}</td></tr>
        <tr><td><b>アカウント</b></td><td>${escapeHtml(session.user.email)}（${escapeHtml(session.user.id)}）</td></tr>
      </table>
      <hr />
      <p style="white-space: pre-wrap">${escapeHtml(message)}</p>
    `,
  });

  if (!result?.sent) {
    return {
      ok: false,
      error:
        result?.reason === 'not-configured'
          ? 'メール送信が未設定のため送信できませんでした。運営者にご連絡ください。'
          : '送信に失敗しました。時間をおいて再度お試しください。',
    };
  }

  return { ok: true };
}
