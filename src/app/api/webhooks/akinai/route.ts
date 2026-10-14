import { NextResponse } from 'next/server';
import { akinaiConfig, applyGrant, verifyAkinaiSignature } from '@/lib/akinai';

type AkinaiEvent = {
  id?: string;
  type?: string;
  created?: string;
  data?: { email?: string; orderId?: string; productId?: string; status?: string };
};

/**
 * Akinai hub posts entitlement.granted / entitlement.revoked here, signed with
 * the client secret. Each event carries the order's state at send time, so
 * applying it is an idempotent upsert; retries and reordering are harmless.
 */
export async function POST(req: Request) {
  const config = akinaiConfig();
  if (!config) return NextResponse.json({ error: 'not configured' }, { status: 503 });

  const body = await req.text();
  if (body.length > 20000) return NextResponse.json({ error: 'too large' }, { status: 413 });
  if (!(await verifyAkinaiSignature(req.headers.get('akinai-signature'), body, config.clientSecret))) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  let event: AkinaiEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  if (event.type === 'ping') return NextResponse.json({ ok: true });
  if (event.type !== 'entitlement.granted' && event.type !== 'entitlement.revoked') {
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const d = event.data ?? {};
  if (!d.email || !d.orderId || !d.productId || !event.created) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }

  await applyGrant(process.env.DB as unknown as D1Database, {
    orderId: d.orderId,
    email: d.email,
    productId: d.productId,
    status: d.status === 'active' ? 'ACTIVE' : 'REVOKED',
    eventAt: event.created,
  });
  return NextResponse.json({ ok: true });
}
