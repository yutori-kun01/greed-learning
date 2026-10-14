import { describe, it, expect, vi, beforeEach } from 'vitest';
import { canAccessCourse, getAccessibleCourseIds } from './access';
import { getDb } from '@/db';

// A drizzle-shaped chain that resolves to `result` whether the caller ends
// with .limit() or just awaits the builder.
function chain(result: unknown) {
  const builder: any = {
    from: () => builder,
    where: () => builder,
    limit: () => Promise.resolve(result),
    then: (resolve: (v: unknown) => unknown) => resolve(result),
  };
  return builder;
}

// Each query in access.ts runs in a fixed order, so queue one result per call.
function mockQueries(...results: unknown[]) {
  const select = vi.fn();
  for (const result of results) select.mockReturnValueOnce(chain(result));
  select.mockReturnValue(chain([]));
  vi.mocked(getDb).mockReturnValue({ select } as any);
  return select;
}

const D1 = {} as D1Database;
const activeOnPlan = { id: 'u1', subscriptionStatus: 'ACTIVE', planId: 'plan-pro' };

beforeEach(() => {
  vi.mocked(getDb).mockReset();
});

describe('canAccessCourse', () => {
  it('allows any signed-in member into an ungated course', async () => {
    await expect(
      canAccessCourse(D1, 'u1', { id: 'c1', requiredPlanId: null, akinaiProductIds: null })
    ).resolves.toBe(true);
  });

  it('allows a member whose active plan matches the course', async () => {
    mockQueries([activeOnPlan]);
    await expect(
      canAccessCourse(D1, 'u1', { id: 'c1', requiredPlanId: 'plan-pro', akinaiProductIds: null })
    ).resolves.toBe(true);
  });

  it('denies a member on a different plan with no enrollment', async () => {
    mockQueries([{ ...activeOnPlan, planId: 'plan-basic' }], []);
    await expect(
      canAccessCourse(D1, 'u1', { id: 'c1', requiredPlanId: 'plan-pro', akinaiProductIds: null })
    ).resolves.toBe(false);
  });

  // The regression that matters most: cancelling must actually revoke access,
  // even though planId still points at the plan the member used to be on.
  it('denies a cancelled member still carrying the matching planId', async () => {
    mockQueries([{ ...activeOnPlan, subscriptionStatus: 'CANCELED' }], []);
    await expect(
      canAccessCourse(D1, 'u1', { id: 'c1', requiredPlanId: 'plan-pro', akinaiProductIds: null })
    ).resolves.toBe(false);
  });

  it('denies a member whose payment is past due', async () => {
    mockQueries([{ ...activeOnPlan, subscriptionStatus: 'PAST_DUE' }], []);
    await expect(
      canAccessCourse(D1, 'u1', { id: 'c1', requiredPlanId: 'plan-pro', akinaiProductIds: null })
    ).resolves.toBe(false);
  });

  it('allows an explicit enrollment to override the plan requirement', async () => {
    mockQueries([{ ...activeOnPlan, subscriptionStatus: 'NONE', planId: null }], [{ courseId: 'c1' }]);
    await expect(
      canAccessCourse(D1, 'u1', { id: 'c1', requiredPlanId: 'plan-pro', akinaiProductIds: null })
    ).resolves.toBe(true);
  });

  it('denies a user row that no longer exists', async () => {
    mockQueries([], []);
    await expect(
      canAccessCourse(D1, 'u1', { id: 'c1', requiredPlanId: 'plan-pro', akinaiProductIds: null })
    ).resolves.toBe(false);
  });
});

describe('getAccessibleCourseIds', () => {
  it('returns every ungated course without touching the database', async () => {
    const ids = await getAccessibleCourseIds(D1, 'u1', [
      { id: 'open-1', requiredPlanId: null, akinaiProductIds: null },
      { id: 'open-2', requiredPlanId: null, akinaiProductIds: null },
    ]);
    expect(ids).toEqual(new Set(['open-1', 'open-2']));
  });

  it('includes gated courses only where the plan matches or an enrollment exists', async () => {
    mockQueries([activeOnPlan], [{ courseId: 'granted' }]);

    const ids = await getAccessibleCourseIds(D1, 'u1', [
      { id: 'open', requiredPlanId: null, akinaiProductIds: null },
      { id: 'on-plan', requiredPlanId: 'plan-pro', akinaiProductIds: null },
      { id: 'other-plan', requiredPlanId: 'plan-elite', akinaiProductIds: null },
      { id: 'granted', requiredPlanId: 'plan-elite', akinaiProductIds: null },
    ]);

    expect(ids).toEqual(new Set(['open', 'on-plan', 'granted']));
    expect(ids.has('other-plan')).toBe(false);
  });

  it('excludes gated courses for a cancelled member', async () => {
    mockQueries([{ ...activeOnPlan, subscriptionStatus: 'CANCELED' }], []);

    const ids = await getAccessibleCourseIds(D1, 'u1', [
      { id: 'open', requiredPlanId: null, akinaiProductIds: null },
      { id: 'gated', requiredPlanId: 'plan-pro', akinaiProductIds: null },
    ]);

    expect(ids).toEqual(new Set(['open']));
  });
});

describe('Akinai hub purchases', () => {
  const sold = { id: 'c9', requiredPlanId: null, akinaiProductIds: '["prod-1","prod-2"]' };
  const member = { id: 'u1', email: 'Buyer@Example.com', subscriptionStatus: 'NONE', planId: null };

  it('treats a course linked to store products as gated', async () => {
    mockQueries([member], [], []);
    await expect(canAccessCourse(D1, 'u1', sold)).resolves.toBe(false);
  });

  it('opens it for a member whose email has an active grant for one of its products', async () => {
    mockQueries([member], [], [{ productId: 'prod-2' }]);
    await expect(canAccessCourse(D1, 'u1', sold)).resolves.toBe(true);
  });

  it('keeps a course with a malformed product list locked', async () => {
    mockQueries([member], []);
    await expect(canAccessCourse(D1, 'u1', { ...sold, akinaiProductIds: 'not json' })).resolves.toBe(false);
    mockQueries([member], [], []);
    await expect(canAccessCourse(D1, 'u1', { ...sold, akinaiProductIds: '["prod-1"]' })).resolves.toBe(false);
  });

  it('includes purchased courses in the batch result only', async () => {
    mockQueries([member], [], [{ productId: 'prod-1' }]);
    const ids = await getAccessibleCourseIds(D1, 'u1', [
      sold,
      { id: 'c10', requiredPlanId: null, akinaiProductIds: '["prod-3"]' },
      { id: 'c11', requiredPlanId: null, akinaiProductIds: null },
    ]);
    expect([...ids].sort()).toEqual(['c11', 'c9']);
  });
});
