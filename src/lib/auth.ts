import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@/db";
import { Resend } from "resend";

export function getAuth(d1: D1Database) {
  const db = getDb(d1);
  const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');

  const auth = betterAuth({
    database: drizzleAdapter(db, { provider: "sqlite" }),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
    session: {
      expiresIn: 60 * 60 * 24 * 90, // 90 days
      updateAge: 60 * 60 * 24,      // 1 day
    },
    emailAndPassword: {
      enabled: true,
      sendPasswordResetEmail: async ({ user, url }: { user: any, url: string }) => {
        if (!process.env.RESEND_API_KEY) {
          console.warn('RESEND_API_KEY is missing. Password reset URL:', url);
          return;
        }
        await resend.emails.send({
          from: 'Greed Learning <noreply@greed-learning.com>',
          to: user.email,
          subject: 'パスワードのリセット - Greed Learning',
          html: `<p>パスワードのリセットリクエストを受け付けました。</p><p><a href="${url}">こちらのリンク</a>をクリックして新しいパスワードを設定してください。</p>`,
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url }: { user: any, url: string }) => {
        if (!process.env.RESEND_API_KEY) {
          console.warn('RESEND_API_KEY is missing. Email verification URL:', url);
          return;
        }
        await resend.emails.send({
          from: 'Greed Learning <noreply@greed-learning.com>',
          to: user.email,
          subject: '【Greed Learning】メールアドレスの確認',
          html: `
            <h2>${user.name || 'ゲスト'} 様</h2>
            <p>Greed Learning へのご登録ありがとうございます！</p>
            <p>以下のリンクをクリックして、メールアドレスの確認を完了してください。</p>
            <p><a href="${url}" style="display:inline-block;padding:10px 20px;background:#d9b45b;color:#101d31;text-decoration:none;border-radius:6px;font-weight:bold;">メールアドレスを確認する</a></p>
            <p>※本メールにお心当たりのない場合は、そのまま破棄してください。</p>
          `,
        });
      },
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      },
    },
    user: {
      additionalFields: {
        role: { type: "string", defaultValue: "MEMBER", input: false },
        currentStreak: { type: "number", defaultValue: 0, input: false },
        longestStreak: { type: "number", defaultValue: 0, input: false },
        lastActivityDate: { type: "string", required: false, input: false },
        stripeCustomerId: { type: "string", required: false, input: false },
        noteId: { type: "string", required: false },
        xId: { type: "string", required: false },
        themePreference: { type: "string", defaultValue: "dark", required: false },
      },
    },
  });

  // DEV ONLY: Bypass auth for easy local testing
  // (Uncomment this and set ENABLE_DEV_BYPASS=true in .env if you need to test without logging in)
  if (process.env.NODE_ENV === 'development' && process.env.ENABLE_DEV_BYPASS === 'true') {
    const originalGetSession = auth.api.getSession;
    // @ts-ignore - Dev only override
    auth.api.getSession = async (opts: any) => {
      const session = await originalGetSession(opts);
      if (!session) {
        return {
          user: { id: 'dev-dummy-user', name: 'ゲストユーザー', email: 'guest@example.com', role: 'ADMIN', createdAt: new Date(), updatedAt: new Date(), emailVerified: false },
          session: { id: 'dev-dummy-session', userId: 'dev-dummy-user', expiresAt: new Date(Date.now() + 86400000), token: 'dummy', createdAt: new Date(), updatedAt: new Date(), ipAddress: '', userAgent: '' }
        } as any;
      }
      return session;
    };
  }

  return auth;
}
