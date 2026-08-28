import { describe, it, expect, vi } from 'vitest'
import { createCourse, deleteCourse, getCourses } from './courses'
import { getDb } from '@/db'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

describe('Courses Actions', () => {
  it('should list courses successfully', async () => {
    vi.mocked(getDb).mockReturnValueOnce({
      select: () => ({
        from: () => ({
          orderBy: () => Promise.resolve([{ id: 'c-1', title: 'Course 1' }])
        })
      })
    } as any);
    
    const courses = await getCourses();
    expect(courses).toEqual([{ id: 'c-1', title: 'Course 1' }]);
  });

  it('should create a course successfully', async () => {
    const formData = new FormData();
    formData.append('title', 'New Course');
    formData.append('description', 'Course Desc');
    formData.append('category', 'MARKETING');
    formData.append('status', 'DRAFT');
    formData.append('badge', '');

    const result = await createCourse(formData);
    expect(result).toHaveProperty('success', true);
  });

  it('should fail to create course without title', async () => {
    const formData = new FormData();
    // No title
    formData.append('description', 'Course Desc');
    
    await expect(createCourse(formData)).rejects.toThrow('タイトルは必須です');
  });

  it('should delete a course successfully', async () => {
    const result = await deleteCourse('course-id-1');
    expect(result).toHaveProperty('success', true);
  });
});
