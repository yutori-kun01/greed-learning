import type Stripe from 'stripe';

/**
 * Collapses Stripe's subscription statuses into the three the app gates on.
 * Anything unrecognised denies access rather than granting it.
 *
 * Lives outside the webhook route because `route.ts` may only export request
 * handlers and segment config.
 */
export function mapSubscriptionStatus(
  status: Stripe.Subscription.Status
): 'ACTIVE' | 'PAST_DUE' | 'CANCELED' {
  if (status === 'active' || status === 'trialing') return 'ACTIVE';
  if (status === 'past_due' || status === 'unpaid' || status === 'incomplete') return 'PAST_DUE';
  return 'CANCELED';
}
