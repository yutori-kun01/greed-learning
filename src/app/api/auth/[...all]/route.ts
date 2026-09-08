import { getAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'development' && process.env.ENABLE_DEV_BYPASS === 'true') {
    if (req.nextUrl.pathname === '/api/auth/get-session') {
      return NextResponse.json({
        user: { id: 'dev-dummy-user', name: 'ゲストユーザー', email: 'guest@example.com', role: 'ADMIN', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), emailVerified: false },
        session: { id: 'dev-dummy-session', userId: 'dev-dummy-user', expiresAt: new Date(Date.now() + 86400000).toISOString(), token: 'dummy', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ipAddress: '', userAgent: '' }
      });
    }
  }

  const auth = getAuth(process.env.DB as unknown as D1Database);
  return auth.handler(req);
}

export async function POST(req: NextRequest) {
  const auth = getAuth(process.env.DB as unknown as D1Database);
  return auth.handler(req);
}
