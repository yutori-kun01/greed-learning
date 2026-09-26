import { describe, it, expect, vi, beforeEach } from 'vitest'

const constructEventAsync = vi.fn()
const subscriptionsRetrieve = vi.fn()

vi.mock('stripe', () => ({
  default: class {
    webhooks = { constructEventAsync }
    subscriptions = { retrieve: subscriptionsRetrieve }
  },
}))

import { POST, mapSubscriptionStatus } from './route'
import { getDb } from '@/db'

const updates: Record<string, unknown>[] = []
const inserts: Record<string, unknown>[] = []

function fakeDb(options: { insertThrows?: Error } = {}) {
  return {
    update: () => ({
      set(values: Record<string, unknown>) {
        updates.push(values)
        return { where: () => Promise.resolve() }
      },
    }),
    insert: () => ({
      values(values: Record<string, unknown>) {
        if (options.insertThrows) throw options.insertThrows
        inserts.push(values)
        return Promise.resolve()
      },
    }),
    select: () => ({
      from: () => ({ where: () => ({ limit: () => Promise.resolve([{ id: 'plan-1' }]) }) }),
    }),
  }
}

const request = (signature: string | null) =>
  new Request('https://example.com/api/webhooks/stripe', {
    method: 'POST',
    headers: signature ? { 'stripe-signature': signature } : {},
    body: '{}',
  })

beforeEach(() => {
  updates.length = 0
  inserts.length = 0
  constructEventAsync.mockReset()
  subscriptionsRetrieve.mockReset()
  vi.mocked(getDb).mockReturnValue(fakeDb() as never)
  process.env.STRIPE_SECRET_KEY = 'sk_test'
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
})

describe('mapSubscriptionStatus', () => {
  it('treats trialing as active and unpaid states as past due', () => {
    expect(mapSubscriptionStatus('active')).toBe('ACTIVE')
    expect(mapSubscriptionStatus('trialing')).toBe('ACTIVE')
    expect(mapSubscriptionStatus('past_due')).toBe('PAST_DUE')
    expect(mapSubscriptionStatus('unpaid')).toBe('PAST_DUE')
    expect(mapSubscriptionStatus('incomplete')).toBe('PAST_DUE')
    expect(mapSubscriptionStatus('canceled')).toBe('CANCELED')
    expect(mapSubscriptionStatus('incomplete_expired')).toBe('CANCELED')
  })
})

describe('POST /api/webhooks/stripe', () => {
  it('rejects a request with no signature without touching the database', async () => {
    const res = await POST(request(null))

    expect(res.status).toBe(400)
    expect(constructEventAsync).not.toHaveBeenCalled()
    expect(updates).toHaveLength(0)
  })

  it('rejects a request whose signature does not verify', async () => {
    constructEventAsync.mockRejectedValue(new Error('signature mismatch'))

    const res = await POST(request('t=1,v1=forged'))

    expect(res.status).toBe(400)
    expect(updates).toHaveLength(0)
    expect(inserts).toHaveLength(0)
  })

  it('records a purchase for a one-off checkout', async () => {
    constructEventAsync.mockResolvedValue({
      type: 'checkout.session.completed',
      data: { object: { mode: 'payment', id: 'cs_1', amount_total: 1500, metadata: { userId: 'u1', postId: 'post-1' } } },
    })

    const res = await POST(request('t=1,v1=ok'))

    expect(res.status).toBe(200)
    expect(inserts[0]).toMatchObject({ userId: 'u1', postId: 'post-1', stripeSessionId: 'cs_1', amount: 1500 })
  })

  it('does not fail when the same checkout session is delivered twice', async () => {
    vi.mocked(getDb).mockReturnValue(
      fakeDb({ insertThrows: new Error('UNIQUE constraint failed: purchases.stripeSessionId') }) as never
    )
    constructEventAsync.mockResolvedValue({
      type: 'checkout.session.completed',
      data: { object: { mode: 'payment', id: 'cs_1', amount_total: 1500, metadata: { userId: 'u1', postId: 'post-1' } } },
    })

    const res = await POST(request('t=1,v1=ok'))

    // Stripe retries deliveries; a duplicate must not come back as a 500.
    expect(res.status).toBe(200)
  })

  it('marks the subscription canceled when Stripe deletes it', async () => {
    constructEventAsync.mockResolvedValue({
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_1' } },
    })

    const res = await POST(request('t=1,v1=ok'))

    expect(res.status).toBe(200)
    expect(updates).toContainEqual(expect.objectContaining({ subscriptionStatus: 'CANCELED' }))
  })

  it('syncs plan and period when a subscription is updated', async () => {
    constructEventAsync.mockResolvedValue({
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_1',
          status: 'past_due',
          items: { data: [{ price: { id: 'price_1' }, current_period_end: 1800000000 }] },
        },
      },
    })

    const res = await POST(request('t=1,v1=ok'))

    expect(res.status).toBe(200)
    expect(updates[0]).toMatchObject({ planId: 'plan-1', subscriptionStatus: 'PAST_DUE' })
  })
})
