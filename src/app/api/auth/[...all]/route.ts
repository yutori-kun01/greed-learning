import { getAuth } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  // @ts-ignore - process.env.DB is populated by @opennextjs/cloudflare
  const auth = getAuth(process.env.DB as unknown as D1Database);
  return auth.handler(req);
}

export async function POST(req: NextRequest) {
  // @ts-ignore
  const auth = getAuth(process.env.DB as unknown as D1Database);
  return auth.handler(req);
}
