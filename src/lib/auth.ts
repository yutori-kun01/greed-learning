import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@/db";

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
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      },
    },
    user: {
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
