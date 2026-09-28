import { describe, it, expect } from 'vitest';
import { mapSubscriptionStatus } from './subscriptionStatus';

// This mapping decides whether a paying member keeps access, so every Stripe
// status is pinned explicitly rather than relying on the fallback.
describe('mapSubscriptionStatus', () => {
  it('grants access while the subscription is active or trialing', () => {
    expect(mapSubscriptionStatus('active')).toBe('ACTIVE');
    expect(mapSubscriptionStatus('trialing')).toBe('ACTIVE');
  });

  it('flags recoverable payment problems as PAST_DUE', () => {
    expect(mapSubscriptionStatus('past_due')).toBe('PAST_DUE');
    expect(mapSubscriptionStatus('unpaid')).toBe('PAST_DUE');
    expect(mapSubscriptionStatus('incomplete')).toBe('PAST_DUE');
  });

  it('revokes access for terminal states', () => {
    expect(mapSubscriptionStatus('canceled')).toBe('CANCELED');
    expect(mapSubscriptionStatus('incomplete_expired')).toBe('CANCELED');
    expect(mapSubscriptionStatus('paused')).toBe('CANCELED');
  });

  it('denies rather than grants on an unrecognised status', () => {
    expect(mapSubscriptionStatus('something_new' as never)).toBe('CANCELED');
  });
});
