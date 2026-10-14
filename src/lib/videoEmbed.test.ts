import { describe, expect, it } from 'vitest';
import { videoEmbed } from './videoEmbed';

describe('videoEmbed', () => {
  it('turns Loom share links into the embed player', () => {
    expect(videoEmbed('https://www.loom.com/share/0123456789abcdef0123456789abcdef?sid=xyz')).toEqual({
      provider: 'loom',
      src: 'https://www.loom.com/embed/0123456789abcdef0123456789abcdef',
    });
    expect(videoEmbed('https://loom.com/embed/0123456789abcdef0123456789abcdef')?.src).toBe(
      'https://www.loom.com/embed/0123456789abcdef0123456789abcdef'
    );
  });

  it('turns YouTube watch and short links into the embed player', () => {
    expect(videoEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10')?.src).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?enablejsapi=1&playsinline=1&rel=0');
    expect(videoEmbed('https://youtu.be/dQw4w9WgXcQ')?.src).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?enablejsapi=1&playsinline=1&rel=0');
  });

  it('handles public and unlisted Vimeo links', () => {
    expect(videoEmbed('https://vimeo.com/123456789')?.src).toBe('https://player.vimeo.com/video/123456789');
    expect(videoEmbed('https://vimeo.com/123456789/abcdef1234')?.src).toBe('https://player.vimeo.com/video/123456789?h=abcdef1234');
    expect(videoEmbed('https://player.vimeo.com/video/123456789?h=abcdef1234')?.src).toBe('https://player.vimeo.com/video/123456789?h=abcdef1234');
  });

  it('rejects other sites and malformed input', () => {
    expect(videoEmbed('https://evil.example/share/0123456789abcdef')).toBeNull();
    expect(videoEmbed('https://www.loom.com/share/<script>')).toBeNull();
    expect(videoEmbed('javascript:alert(1)')).toBeNull();
    expect(videoEmbed('not a url')).toBeNull();
    expect(videoEmbed('')).toBeNull();
  });
});
