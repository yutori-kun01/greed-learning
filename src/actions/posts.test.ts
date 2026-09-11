import { describe, it, expect } from 'vitest'
import { createPost, deletePost } from './posts'

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

  // A PAID post priced at zero is free content behind a purchase button.
  it('should reject a paid post with no price', async () => {
    const formData = new FormData();
    formData.append('title', 'Paid');
    formData.append('slug', 'paid');
    formData.append('status', 'PAID');
    formData.append('price', '0');

    await expect(createPost(formData)).rejects.toThrow('1円以上の価格');
  });

  it('should fall back to DRAFT for an unrecognised status', async () => {
    const formData = new FormData();
    formData.append('title', 'Odd');
    formData.append('slug', 'odd');
    formData.append('status', 'SOMETHING_ELSE');

    await expect(createPost(formData)).resolves.toHaveProperty('success', true);
  });

  it('should delete a post', async () => {
    await expect(deletePost('post-1')).resolves.toHaveProperty('success', true);
  });



});
