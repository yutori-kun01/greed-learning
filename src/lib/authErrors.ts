/**
 * Japanese text for the Better Auth errors members actually hit. Anything
 * unrecognised falls back to the server's own message, then to `fallback`.
 */
const MESSAGES: Record<string, string> = {
  MISSING_RESPONSE: 'ボット対策のチェックを完了してください。',
  VERIFICATION_FAILED: 'ボット対策の確認に失敗しました。チェックをやり直してください。',
  INVALID_EMAIL_OR_PASSWORD: 'メールアドレスまたはパスワードが正しくありません。',
  USER_ALREADY_EXISTS: 'このメールアドレスは既に登録されています。',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'このメールアドレスは既に登録されています。',
  PASSWORD_TOO_SHORT: 'パスワードは8文字以上で入力してください。',
  UNKNOWN_ERROR: 'エラーが発生しました。時間をおいて再度お試しください。',
  EMAIL_NOT_VERIFIED: 'メールアドレスの確認が完了していません。届いたメールのリンクを開いてください。',
};

export function authErrorMessage(
  error: { code?: string; message?: string; status?: number } | null | undefined,
  fallback: string
): string {
  if (!error) return fallback;
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code];
  if (error.status === 429) return '試行回数が多すぎます。しばらく待ってから再度お試しください。';
  return error.message || fallback;
}
