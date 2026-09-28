import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { user } from '@/db/schema';
import { getSiteSettingsQuery } from '@/lib/queries';
import { SIGNUP_PASS_COOKIE, verifySignupPass } from '@/lib/signupPass';
import PasscodeForm from './PasscodeForm';
import SignupForm from './SignupForm';

// Depends on the visitor's pass cookie and the current passcode.
export const dynamic = 'force-dynamic';

/**
 * The invite URL. Visitors first enter the signup passcode; only a browser
 * holding a valid pass sees the account form. The form is a convenience —
 * the user create hook re-checks the same pass, so posting to the sign-up
 * endpoint directly does not get around it.
 */
export default async function SignupPage() {
  const settings = await getSiteSettingsQuery();
  const passcode = settings?.signupPasscode ?? null;

  if (!passcode) {
    // First run: nobody is admin yet, so the operator signs up here with
    // BOOTSTRAP_ADMIN_EMAIL (the only address the hook accepts without a
    // passcode) and sets the passcode afterwards.
    const admins = await getDb(process.env.DB as unknown as D1Database)
      .select({ id: user.id })
      .from(user)
      .where(eq(user.role, 'ADMIN'))
      .limit(1);
    if (admins.length === 0 && process.env.BOOTSTRAP_ADMIN_EMAIL) {
      return <SignupForm notice="管理者アカウントの作成です。管理者として設定したメールアドレスで登録してください。" />;
    }

    return (
      <div className="auth-container">
        <div className="auth-box">
          <h1 className="auth-title">会員登録</h1>
          <p className="auth-subtitle">現在、新規登録は受け付けていません。</p>
          <p className="auth-foot">
            すでにアカウントをお持ちの方は <a href="/login" className="auth-link">ログイン</a>
          </p>
        </div>
      </div>
    );
  }

  const pass = (await cookies()).get(SIGNUP_PASS_COOKIE)?.value;
  const unlocked = await verifySignupPass(pass, process.env.BETTER_AUTH_SECRET ?? '', passcode);

  return unlocked ? <SignupForm /> : <PasscodeForm />;
}
