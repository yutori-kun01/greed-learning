import { describe, it, expect, vi } from 'vitest'
import { createPost, deletePost, getPosts, getPublishedPosts, getPostBySlug } from './posts'
import { getDb } from '@/db'

describe('Posts Actions', () => {
  it('should create a post successfully', async () => {
    const formData = new FormData();
    formData.append('title', 'My Post');
    formData.append('slug', 'my-post');
    formData.append('status', 'PUBLISHED');
    formData.append('content', 'Hello World');

    const result = await createPost(formData);
    expect(result).toHaveProperty('success', true);
  });

  it('should require a title and slug', async () => {
    const formData = new FormData();
    formData.append('status', 'PUBLISHED');
    
    await expect(createPost(formData)).rejects.toThrow('タイトルとスラッグは必須です');
  });

  it('should fetch posts list', async () => {
    // We can't easily override just one query with the generic proxy, so we'll mock the whole select chain
    vi.mocked(getDb).mockReturnValueOnce({
      select: () => ({
        from: () => ({
          orderBy: () => Promise.resolve([{ id: 'p-1', title: 'Test Post' }])
        })
      })
    } as any);
    
    const posts = await getPosts();
    expect(posts).toHaveLength(1);
    expect(posts[0].title).toBe('Test Post');
  });

  it('should fetch published posts list', async () => {
    vi.mocked(getDb).mockReturnValueOnce({
      select: () => ({
        from: () => ({
          orderBy: () => Promise.resolve([{ id: 'p-1', title: 'Published Post', status: 'PUBLISHED' }])
        })
      })
    } as any);
    
    const posts = await getPublishedPosts();
    expect(posts).toHaveLength(1);
    expect(posts[0].title).toBe('Published Post');
  });

  it('should fetch post by slug', async () => {
    vi.mocked(getDb).mockReturnValueOnce({
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([{ id: 'p-1', slug: 'my-post', title: 'My Post' }])
          })
        })
      })
    } as any);
    
    const post = await getPostBySlug('my-post');
    expect(post).not.toBeNull();
    expect(post?.slug).toBe('my-post');
  });
});
