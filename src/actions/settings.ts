'use server';

import { getDb } from '@/db';
import { user, siteSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAdmin, requireUser } from '@/lib/session';
import { normalizeImageUrl } from '@/lib/imageUrl';
import { sealSecret } from '@/lib/secretBox';
import { sendEmailDetailed } from '@/lib/email';

// Next.js replaces the message of anything thrown from a Server Action with a
// generic one in production, so input the user can fix is reported as a
// value, and throwing is kept for authorization failures only.
export type SaveResult = { success: true } | { success: false; error: string };

function invalid(error: unknown): SaveResult {
  return { success: false, error: (error as Error).message };
}

// Helper for DB instance
const db = () => getDb(process.env.DB as unknown as D1Database);

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const DEFAULT_ACCENT = '#d9b45b';

function normalizeAccentColor(value: string | null): string {
  const candidate = (value || '').trim();
  if (!candidate) return DEFAULT_ACCENT;
  if (HEX_COLOR.test(candidate)) return candidate.toLowerCase();
  throw new Error('アクセントカラーは #rrggbb 形式で指定してください');
}

export async function updateSiteSettings(formData: FormData): Promise<SaveResult> {
  await requireAdmin();

  const siteName = formData.get('siteName') as string;

  // Blank closes signup. A short code is guessable even with the attempt
  // limit, so require a little length.
  const signupPasscode = ((formData.get('signupPasscode') as string) || '').trim() || null;
  if (signupPasscode && signupPasscode.length < 6) {
    return { success: false, error: '登録用パスコードは6文字以上にしてください' };
  }

  let accentColor: string;
  let logoUrl: string | null;
  try {
    // Rendered into a CSS custom property, so anything but a literal colour
    // would let an admin inject arbitrary CSS onto every page of the site.
    accentColor = normalizeAccentColor(formData.get('accentColor') as string);
    logoUrl = normalizeImageUrl(formData.get('logoUrl'));
  } catch (error) {
    return invalid(error);
  }
  const bgPattern = formData.get('bgPattern') as string;

  const operatorName = (formData.get('operatorName') as string) || null;
  const operatorRepresentative = (formData.get('operatorRepresentative') as string) || null;
  const operatorAddress = (formData.get('operatorAddress') as string) || null;
  const operatorPhone = (formData.get('operatorPhone') as string) || null;
  const operatorEmail = (formData.get('operatorEmail') as string) || null;
  const tokushohoExtra = (formData.get('tokushohoExtra') as string) || null;
  const termsContent = (formData.get('termsContent') as string) || null;
  const privacyContent = (formData.get('privacyContent') as string) || null;

  // Resend. The key is write-only: a blank field keeps the stored key, the
  // clear checkbox removes it, and a new value replaces it (encrypted).
  const resendFromEmail = ((formData.get('resendFromEmail') as string) || '').trim() || null;
  if (resendFromEmail && !/^[^<>\s]*@[^<>\s]+$|^[^<>]*<[^<>\s]+@[^<>\s]+>$/.test(resendFromEmail)) {
    return { success: false, error: '送信元メールアドレスは no-reply@example.com か「表示名 <no-reply@example.com>」の形式で入力してください' };
  }
  const newResendKey = ((formData.get('resendApiKey') as string) || '').trim();
  const clearResendKey = formData.get('resendApiKeyClear') === 'on';
  let resendApiKeyEnc: string | null | undefined;
  if (clearResendKey) {
    resendApiKeyEnc = null;
  } else if (newResendKey) {
    if (!newResendKey.startsWith('re_')) {
      return { success: false, error: 'ResendのAPIキーは「re_」で始まる文字列です。コピーした内容を確認してください' };
    }
    resendApiKeyEnc = await sealSecret(newResendKey, process.env.BETTER_AUTH_SECRET ?? '');
  }

  const values = {
    siteName,
    accentColor,
    bgPattern,
    logoUrl,
    operatorName,
    operatorRepresentative,
    operatorAddress,
    operatorPhone,
    operatorEmail,
    tokushohoExtra,
    termsContent,
    privacyContent,
    signupPasscode,
    resendFromEmail,
    ...(resendApiKeyEnc !== undefined ? { resendApiKeyEnc } : {}),
    updatedAt: new Date().toISOString(),
  };

  await db().insert(siteSettings).values({ id: '1', ...values }).onConflictDoUpdate({
    target: siteSettings.id,
    set: values,
  });

  revalidatePath('/', 'layout');
  revalidatePath('/legal/tokushoho');
  revalidatePath('/legal/terms');
  revalidatePath('/legal/privacy');
  return { success: true };
}

export async function updateUserProfile(formData: FormData): Promise<SaveResult> {
  const me = await requireUser();

  const name = ((formData.get('name') as string) || '').trim();
  if (!name) return { success: false, error: '表示名を入力してください' };
  const noteId = formData.get('noteId') as string;
  const xId = formData.get('xId') as string;
  let image: string | null;
  try {
    image = normalizeImageUrl(formData.get('image'));
  } catch (error) {
    return invalid(error);
  }

  await db().update(user)
    .set({ name, noteId, xId, image })
    .where(eq(user.id, me.id));

  revalidatePath('/settings');
  return { success: true };
}


/** Sends a test message to the signed-in admin with the saved email settings. */
export async function sendTestEmail(): Promise<SaveResult> {
  const admin = await requireAdmin();
  const result = await sendEmailDetailed({
    to: admin.email,
    subject: 'テストメール（メール送信の設定確認）',
    html: '<p>このメールが届いていれば、メール送信（Resend）の設定は正しく動作しています。</p>',
  });
  return result.ok
    ? { success: true }
    : { success: false, error: result.error };
}
