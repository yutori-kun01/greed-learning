import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@/db";

export function getAuth(d1: D1Database) {
  const db = getDb(d1);
  const auth = betterAuth({
    database: drizzleAdapter(db, { provider: "sqlite" }),
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
  });

  // DEV ONLY: Bypass auth for easy local testing
  if (process.env.NODE_ENV === 'development') {
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
