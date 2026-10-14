import { getDb } from '@/db';
import { akinaiGrants } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';

// Akinai hub is the store: it owns buyer sign-in (OpenID Connect) and decides
// who has paid for what. This site keeps a copy of those purchases in
// akinaiGrants and opens the courses linked to the purchased products.
// Configured by AKINAI_ISSUER, AKINAI_CLIENT_ID and AKINAI_CLIENT_SECRET.

export type AkinaiConfig = { issuer: string; clientId: string; clientSecret: string };

export function akinaiConfig(env: Record<string, string | undefined> = process.env): AkinaiConfig | null {
  const issuer = env.AKINAI_ISSUER?.trim().replace(/\/+$/, '');
  const clientId = env.AKINAI_CLIENT_ID?.trim();
  const clientSecret = env.AKINAI_CLIENT_SECRET?.trim();
  if (!issuer || !clientId || !clientSecret || !/^https:\/\//.test(issuer)) return null;
  return { issuer, clientId, clientSecret };
}

/** Product ids stored on a course as a JSON array; anything malformed reads as none. */
export function parseProductIds(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const list = JSON.parse(value);
    return Array.isArray(list) ? list.filter((v): v is string => typeof v === 'string' && v.length > 0 && v.length <= 100) : [];
  } catch {
    return [];
  }
}

const encoder = new TextEncoder();

async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(message))))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Akinai-Signature: t=<unix seconds>,v1=<hex HMAC-SHA256(secret, t + "." + body)>.
 * Rejects anything older or newer than five minutes so a captured request
 * cannot be replayed later.
 */
export async function verifyAkinaiSignature(header: string | null, body: string, secret: string, now = Date.now()) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(',').map((p) => p.trim().split('=', 2) as [string, string]));
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !/^\d+$/.test(t) || !v1 || !/^[a-f0-9]{64}$/.test(v1)) return false;
  if (Math.abs(now / 1000 - Number(t)) > 300) return false;
  return timingSafeEqual(await hmacHex(secret, `${t}.${body}`), v1);
}

export type GrantEvent = { orderId: string; email: string; productId: string; status: 'ACTIVE' | 'REVOKED'; eventAt: string };

/**
 * Upsert one order's state. A delivery older than what is stored is ignored,
 * so retries arriving out of order cannot re-open a refunded purchase.
 */
export async function applyGrant(d1: D1Database, event: GrantEvent) {
  const db = getDb(d1);
  const now = new Date().toISOString();
  const email = event.email.trim().toLowerCase();
  const existing = await db.select().from(akinaiGrants).where(eq(akinaiGrants.orderId, event.orderId)).limit(1);
  const current = existing[0];
  if (current && current.eventAt > event.eventAt) return false;
  if (current) {
    await db.update(akinaiGrants)
      .set({ email, productId: event.productId, status: event.status, eventAt: event.eventAt, updatedAt: now })
      .where(eq(akinaiGrants.orderId, event.orderId));
  } else {
    await db.insert(akinaiGrants).values({ orderId: event.orderId, email, productId: event.productId, status: event.status, eventAt: event.eventAt, updatedAt: now })
      .onConflictDoNothing();
  }
  return true;
}

export type Entitlement = { productId: string; orderId: string; grantedAt?: string };

/**
 * Sign-in carries the full list of what this email has paid for. Everything in
 * it is active; any stored order for this email that is missing from it was
 * refunded or stopped while a webhook was lost, so it is revoked.
 */
export async function syncEntitlements(d1: D1Database, email: string, entitlements: Entitlement[], at = new Date().toISOString()) {
  const db = getDb(d1);
  const address = email.trim().toLowerCase();
  const seen = new Set<string>();
  for (const e of entitlements) {
    if (typeof e?.orderId !== 'string' || typeof e?.productId !== 'string') continue;
    seen.add(e.orderId);
    await applyGrant(d1, { orderId: e.orderId, email: address, productId: e.productId, status: 'ACTIVE', eventAt: at });
  }
  const stored = await db.select().from(akinaiGrants).where(and(eq(akinaiGrants.email, address), eq(akinaiGrants.status, 'ACTIVE')));
  for (const g of stored as Array<typeof akinaiGrants.$inferSelect>) {
    if (!seen.has(g.orderId)) await applyGrant(d1, { ...g, status: 'REVOKED', eventAt: at });
  }
}

/** Active product ids this email has paid for, among the ones asked about. */
export async function grantedProductIds(d1: D1Database, email: string, productIds: string[]): Promise<Set<string>> {
  if (productIds.length === 0 || !email) return new Set();
  const rows = await getDb(d1)
    .select({ productId: akinaiGrants.productId })
    .from(akinaiGrants)
    .where(and(eq(akinaiGrants.email, email.trim().toLowerCase()), eq(akinaiGrants.status, 'ACTIVE'), inArray(akinaiGrants.productId, productIds)));
  return new Set(rows.map((r: { productId: string }) => r.productId));
}

/** Products the store lets this site see, for the course editor. Empty when not configured or unreachable. */
export async function fetchAkinaiProducts(config = akinaiConfig()): Promise<Array<{ id: string; name: string }>> {
  if (!config) return [];
  try {
    const res = await fetch(`${config.issuer}/api/oidc/products`, {
      headers: { Authorization: 'Basic ' + btoa(`${encodeURIComponent(config.clientId)}:${encodeURIComponent(config.clientSecret)}`) },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { products?: Array<{ id: string; name: string }> };
    return Array.isArray(body.products) ? body.products : [];
  } catch {
    return [];
  }
}
