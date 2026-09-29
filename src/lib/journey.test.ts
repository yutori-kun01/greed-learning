import { describe, it, expect } from 'vitest';
import { describeRequirement, evaluateUnlock, hasRequirements, parseThreshold, wouldCreateCycle } from './journey';

const titles = new Map([
  ['basics', '基礎講座'],
  ['advanced', '応用講座'],
]);
const titleOf = (id: string) => titles.get(id);

function progress(completed: string[], totalPoints = 0) {
  return { completedCourseIds: new Set(completed), totalPoints };
}

describe('evaluateUnlock', () => {
  it('opens a course with no rules', () => {
    expect(evaluateUnlock({}, progress([]))).toEqual({ unlocked: true, requirements: [] });
  });

  it('waits for every prerequisite course', () => {
    const rule = { prerequisiteIds: ['basics', 'advanced'] };
    expect(evaluateUnlock(rule, progress(['basics']), titleOf).unlocked).toBe(false);
    expect(evaluateUnlock(rule, progress(['basics', 'advanced']), titleOf).unlocked).toBe(true);
  });

  it('reports which prerequisites are met', () => {
    const status = evaluateUnlock({ prerequisiteIds: ['basics', 'advanced'] }, progress(['basics']), titleOf);
    expect(status.requirements).toEqual([
      { kind: 'course', courseId: 'basics', title: '基礎講座', met: true },
      { kind: 'course', courseId: 'advanced', title: '応用講座', met: false },
    ]);
  });

  // Deleting a course cascades its prerequisite rows, but a stale id must
  // never leave a course locked for good.
  it('ignores a prerequisite that no longer exists', () => {
    expect(evaluateUnlock({ prerequisiteIds: ['gone'] }, progress([]), titleOf).unlocked).toBe(true);
  });

  it('counts completed courses for a threshold', () => {
    const rule = { requiredCompletedCourses: 2 };
    expect(evaluateUnlock(rule, progress(['basics'])).unlocked).toBe(false);
    expect(evaluateUnlock(rule, progress(['basics', 'advanced'])).unlocked).toBe(true);
  });

  it('opens on reaching the point total, not before', () => {
    const rule = { requiredPoints: 500 };
    expect(evaluateUnlock(rule, progress([], 499)).unlocked).toBe(false);
    expect(evaluateUnlock(rule, progress([], 500)).unlocked).toBe(true);
  });

  it('needs every condition when several are set', () => {
    const rule = { prerequisiteIds: ['basics'], requiredPoints: 100 };
    expect(evaluateUnlock(rule, progress(['basics'], 50), titleOf).unlocked).toBe(false);
    expect(evaluateUnlock(rule, progress([], 150), titleOf).unlocked).toBe(false);
    expect(evaluateUnlock(rule, progress(['basics'], 150), titleOf).unlocked).toBe(true);
  });

  it('treats zero and null thresholds as no requirement', () => {
    expect(evaluateUnlock({ requiredCompletedCourses: 0, requiredPoints: null }, progress([])).unlocked).toBe(true);
    expect(hasRequirements({ requiredCompletedCourses: 0, requiredPoints: null, prerequisiteIds: [] })).toBe(false);
    expect(hasRequirements({ requiredPoints: 1 })).toBe(true);
  });
});

describe('describeRequirement', () => {
  it('says how much is left', () => {
    expect(describeRequirement({ kind: 'points', required: 1000, current: 250, met: false })).toBe('1,000pt 到達（あと750pt）');
    expect(describeRequirement({ kind: 'courses', required: 3, current: 1, met: false })).toBe('講座を3つ読了（あと2つ）');
    expect(describeRequirement({ kind: 'course', courseId: 'basics', title: '基礎講座', met: false })).toBe('「基礎講座」を読了');
  });
});

describe('wouldCreateCycle', () => {
  const edges = [
    { courseId: 'b', requiredCourseId: 'a' }, // b needs a
    { courseId: 'c', requiredCourseId: 'b' }, // c needs b
  ];

  it('rejects a course requiring itself', () => {
    expect(wouldCreateCycle([], 'a', ['a'])).toBe(true);
  });

  it('rejects a direct loop', () => {
    expect(wouldCreateCycle(edges, 'a', ['b'])).toBe(true);
  });

  it('rejects a longer loop', () => {
    expect(wouldCreateCycle(edges, 'a', ['c'])).toBe(true);
  });

  it('allows a chain that does not loop back', () => {
    expect(wouldCreateCycle(edges, 'd', ['c'])).toBe(false);
    expect(wouldCreateCycle(edges, 'c', ['a', 'b'])).toBe(false);
  });

  it('judges against the new prerequisites, not the ones being replaced', () => {
    // a currently needs c; replacing that with nothing cannot be a loop.
    const withOld = [...edges, { courseId: 'a', requiredCourseId: 'x' }];
    expect(wouldCreateCycle(withOld, 'a', [])).toBe(false);
  });
});

describe('parseThreshold', () => {
  it('reads positive whole numbers and drops the rest', () => {
    expect(parseThreshold('3')).toBe(3);
    expect(parseThreshold(' 1000 ')).toBe(1000);
    expect(parseThreshold('2.7')).toBe(2);
    expect(parseThreshold('')).toBeNull();
    expect(parseThreshold('0')).toBeNull();
    expect(parseThreshold('-5')).toBeNull();
    expect(parseThreshold('abc')).toBeNull();
    expect(parseThreshold(null)).toBeNull();
  });
});
