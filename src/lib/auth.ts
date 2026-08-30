import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@/db";
import { user as userTable } from "@/db/schema";
import { count } from "drizzle-orm";
import { sendEmail } from "@/lib/email";

export function getAuth(d1: D1Database) {
  const db = getDb(d1);
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
      sendResetPassword: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: "パスワード再設定のご案内",
          html: `<p>${user.name || ''} 様</p><p>パスワードを再設定するには、以下のリンクをクリックしてください（このリンクは1時間有効です）。</p><p><a href="${url}">${url}</a></p><p>心当たりがない場合は、このメールを破棄してください。</p>`,
        });
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: "メールアドレスの確認",
          html: `<p>${user.name || ''} 様</p><p>以下のリンクからメールアドレスを確認してください。</p><p><a href="${url}">${url}</a></p>`,
        });
      },
    },
    rateLimit: {
      enabled: true,
      // Memory storage doesn't survive across Workers isolates; back it
      // with D1 so limits actually hold under real traffic.
      storage: "database",
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      },
    },
    user: {
      changeEmail: {
        enabled: true,
        // This app doesn't require email verification at signup (emailVerified
        // is always false), so gating email changes on a verified-email check
        // would lock every user out of ever changing their address. Apply the
        // change immediately and, when sendVerificationEmail below is
        // configured, follow up with a "verify your new address" email.
        updateEmailWithoutVerification: true,
        sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
          await sendEmail({
            to: user.email,
            subject: "メールアドレス変更のご確認",
            html: `<p>${user.name || ''} 様</p><p>メールアドレスを ${newEmail} に変更するリクエストを受け付けました。変更を確定するには、以下のリンクをクリックしてください。</p><p><a href="${url}">${url}</a></p><p>心当たりがない場合は、このメールを破棄してください。</p>`,
          });
        },
      },
      additionalFields: {
        // Fields the app reads directly off session.user (access control,
        // gating) must be declared here or Better Auth strips them from
        // every getSession() response, even though they exist in the DB.
        role: { type: "string", input: false, defaultValue: "MEMBER" },
        status: { type: "string", input: false, defaultValue: "ACTIVE" },
        currentStreak: { type: "number", input: false, defaultValue: 0 },
        longestStreak: { type: "number", input: false, defaultValue: 0 },
        lastActivityDate: { type: "string", required: false, input: false },
        stripeCustomerId: { type: "string", required: false, input: false },
        noteId: { type: "string", required: false, input: true },
        xId: { type: "string", required: false, input: true },
        themePreference: { type: "string", input: false, defaultValue: "dark" },
        planId: { type: "string", required: false, input: false },
        stripeSubscriptionId: { type: "string", required: false, input: false },
        subscriptionStatus: { type: "string", input: false, defaultValue: "NONE" },
        currentPeriodEnd: { type: "date", required: false, input: false },
      },
    },
    databaseHooks: {
      user: {
        create: {
          // Self-hosted deployments have no seed data — the very first
          // account to sign up becomes the admin so the operator can
          // reach /admin without touching the database by hand.
          before: async (user) => {
            const result = await db.select({ value: count() }).from(userTable);
            if (result[0]?.value === 0) {
              return { data: { ...user, role: "ADMIN" } };
            }
          },
        },
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
