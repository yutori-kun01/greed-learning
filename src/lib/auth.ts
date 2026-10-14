import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@/db";
import { APIError } from "better-auth/api";
import { sendEmail } from "@/lib/email";
import { captcha, genericOAuth } from "better-auth/plugins";
import { and, eq } from "drizzle-orm";
import { akinaiGrants, siteSettings } from "@/db/schema";
import { isSignupAllowed } from "@/lib/signupPolicy";
import { SIGNUP_PASS_COOKIE, readCookie, verifySignupPass } from "@/lib/signupPass";
import { akinaiConfig, syncEntitlements, type Entitlement } from "@/lib/akinai";

async function hasAnyGrant(d1: D1Database, email: string) {
  const rows = await getDb(d1).select({ orderId: akinaiGrants.orderId }).from(akinaiGrants)
    .where(and(eq(akinaiGrants.email, email.trim().toLowerCase()), eq(akinaiGrants.status, "ACTIVE"))).limit(1);
  return rows.length > 0;
}

const emailIsConfigured = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);

export function getAuth(d1: D1Database) {
  const db = getDb(d1);
  const akinai = akinaiConfig();
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
      // Turning this on without a working sender would lock every new account
      // out permanently — the verification mail would only ever be logged.
      // So it follows the Resend configuration: set RESEND_API_KEY and
      // RESEND_FROM_EMAIL and signups must confirm their address.
      requireEmailVerification: emailIsConfigured,
      sendResetPassword: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: "パスワード再設定のご案内",
          html: `<p>${user.name || ''} 様</p><p>パスワードを再設定するには、以下のリンクをクリックしてください（このリンクは1時間有効です）。</p><p><a href="${url}">${url}</a></p><p>心当たりがない場合は、このメールを破棄してください。</p>`,
        });
      },
    },
    emailVerification: {
      sendOnSignUp: emailIsConfigured,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: "メールアドレスの確認",
          html: `<p>${user.name || ''} 様</p><p>以下のリンクからメールアドレスを確認してください。</p><p><a href="${url}">${url}</a></p>`,
        });
      },
    },
    // Cloudflare Turnstile on sign-in, sign-up and password-reset requests.
    // Registered only once the secret is configured, so local development
    // and a first deploy without Turnstile keys still work.
    plugins: [
      ...(process.env.TURNSTILE_SECRET_KEY
        ? [captcha({ provider: "cloudflare-turnstile", secretKey: process.env.TURNSTILE_SECRET_KEY })]
        : []),
      // "Akinai hubでログイン": the store verifies the buyer's email with a
      // one-time code and tells us what they bought. Registered only once
      // AKINAI_ISSUER / AKINAI_CLIENT_ID / AKINAI_CLIENT_SECRET are set.
      ...(akinai
        ? [genericOAuth({
            config: [{
              providerId: "akinai",
              name: "Akinai hub",
              discoveryUrl: `${akinai.issuer}/.well-known/openid-configuration`,
              clientId: akinai.clientId,
              clientSecret: akinai.clientSecret,
              scopes: ["openid", "email", "profile", "entitlements"],
              pkce: true,
              requireIdTokenVerification: true,
              // Every sign-in refreshes this member's purchases from the
              // entitlements claim, so a lost webhook heals at next login.
              async getUserInfo(tokens) {
                const res = await fetch(`${akinai.issuer}/api/oidc/userinfo`, {
                  headers: { Authorization: `Bearer ${tokens.accessToken}` },
                });
                if (!res.ok) return null;
                const info = (await res.json()) as { sub?: string; email?: string; email_verified?: boolean; name?: string; entitlements?: Entitlement[] };
                if (!info.sub || !info.email || info.email_verified !== true) return null;
                await syncEntitlements(d1, info.email, Array.isArray(info.entitlements) ? info.entitlements : []);
                return { id: info.sub, email: info.email, emailVerified: true, name: info.name || info.email.split("@")[0] };
              },
            }],
          })]
        : []),
    ],
    account: {
      accountLinking: {
        // Akinai hub only issues a login after the buyer proves the address
        // with a code, so an existing member with the same email is linked
        // instead of being refused.
        trustedProviders: akinai ? ["akinai"] : [],
      },
    },
    rateLimit: {
      enabled: true,
      // Memory storage doesn't survive across Workers isolates; back it
      // with D1 so limits actually hold under real traffic.
      storage: "database",
    },
    // Registered only when configured: an empty Google provider logged a
    // warning on every request and offered a sign-in that could not work.
    socialProviders:
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            },
          }
        : {},
    user: {
      changeEmail: {
        enabled: true,
        // Accounts created before email delivery was configured have
        // emailVerified false and no way to change it, so gating email
        // changes on a verified address would strand them. Apply the change
        // and confirm it by mail instead.
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
          // Self-hosted deployments have no seed data, so the first operator
          // needs some way into /admin. Granting ADMIN to whoever signs up
          // first would hand the site to any visitor who reaches the public
          // URL before the operator does, so it's gated on an address the
          // operator sets explicitly and removes once they've signed up.
          before: async (newUser, context) => {
            const cookieHeader =
              context?.request?.headers.get("cookie") ?? context?.headers?.get("cookie") ?? null;
            const settings = await db
              .select({ signupPasscode: siteSettings.signupPasscode })
              .from(siteSettings)
              .where(eq(siteSettings.id, "1"))
              .limit(1);
            const hasValidPasscodePass = await verifySignupPass(
              readCookie(cookieHeader, SIGNUP_PASS_COOKIE),
              process.env.BETTER_AUTH_SECRET ?? "",
              settings[0]?.signupPasscode
            );

            // A buyer arriving through "Akinai hubでログイン" has paid for at
            // least one product, which is the invitation. Checked only on that
            // provider's callback: a password signup typing a buyer's address
            // must not ride on their purchase.
            const viaAkinai = context?.path === "/callback/:id" && context?.params?.id === "akinai";
            const isAkinaiBuyer = viaAkinai && !!akinai && (await hasAnyGrant(d1, newUser.email));

            if (!isSignupAllowed(
              newUser.email,
              { BOOTSTRAP_ADMIN_EMAIL: process.env.BOOTSTRAP_ADMIN_EMAIL },
              { hasValidPasscodePass, isAkinaiBuyer }
            )) {
              throw new APIError("FORBIDDEN", {
                message: "登録にはパスコードが必要です。招待URLを開き、パスコードを入力してからアカウントを作成してください。",
              });
            }

            const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
            if (bootstrapEmail && newUser.email.trim().toLowerCase() === bootstrapEmail) {
              return { data: { ...newUser, role: "ADMIN" } };
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
    // @ts-expect-error - dev-only override, deliberately not the full endpoint type
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
