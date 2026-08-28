import { describe, it, expect, vi } from 'vitest'
import { toggleLessonComplete } from './progress'
import { getDb } from '@/db'
import { getAuth } from '@/lib/auth'

describe('Progress Actions', () => {
  it('should throw an error if unauthenticated', async () => {
    // Override getAuth mock for this test
    const mockGetAuth = vi.mocked(getAuth);
    mockGetAuth.mockReturnValueOnce({
      api: { getSession: vi.fn().mockResolvedValue(null) }
    } as any);

    await expect(toggleLessonComplete('lesson-1', true)).rejects.toThrow('Unauthorized');
  });

  it('should mark a lesson as complete', async () => {
    const result = await toggleLessonComplete('lesson-1', true);
    expect(result).toHaveProperty('success', true);
  });

  it('should mark a lesson as incomplete', async () => {
    const result = await toggleLessonComplete('lesson-1', false);
    expect(result).toHaveProperty('success', true);
  });
});
