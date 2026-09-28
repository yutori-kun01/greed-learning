import { describe, expect, it } from 'vitest';
import { coverVariant, lessonThumbnail, youtubeVideoId } from './thumbnails';

describe('youtubeVideoId', () => {
  it('reads the id from every common URL shape', () => {
    expect(youtubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10')).toBe('dQw4w9WgXcQ');
    expect(youtubeVideoId('https://youtu.be/dQw4w9WgXcQ?si=abc')).toBe('dQw4w9WgXcQ');
    expect(youtubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youtubeVideoId('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youtubeVideoId('https://m.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('ignores other hosts and malformed ids', () => {
    expect(youtubeVideoId('https://player.vimeo.com/video/123456')).toBeNull();
    expect(youtubeVideoId('https://evil.example/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(youtubeVideoId('https://www.youtube.com/watch?v=<script>')).toBeNull();
    expect(youtubeVideoId('not a url')).toBeNull();
    expect(youtubeVideoId(null)).toBeNull();
  });
});

describe('lessonThumbnail', () => {
  it('prefers an explicit thumbnail, then the YouTube frame', () => {
    expect(lessonThumbnail({ thumbnailUrl: '/media/thumbs/a.png', videoUrl: 'https://youtu.be/dQw4w9WgXcQ' })).toBe('/media/thumbs/a.png');
    expect(lessonThumbnail({ videoUrl: 'https://youtu.be/dQw4w9WgXcQ' })).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    expect(lessonThumbnail({ videoUrl: 'https://vimeo.com/1' })).toBeNull();
  });
});

describe('coverVariant', () => {
  it('is stable and in range', () => {
    expect(coverVariant('同じタイトル', 4)).toBe(coverVariant('同じタイトル', 4));
    for (const t of ['a', 'b', '講座', 'long title here']) {
      const v = coverVariant(t, 4);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(4);
    }
  });
});
