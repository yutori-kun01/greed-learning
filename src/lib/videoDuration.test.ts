import { describe, expect, it } from 'vitest';
import { parseOembedDuration, parseYoutubeLength } from './videoDuration';

describe('parseOembedDuration', () => {
  it('reads seconds, rounding fractions', () => {
    expect(parseOembedDuration({ type: 'video', duration: 125 })).toBe(125);
    expect(parseOembedDuration({ duration: 61.6 })).toBe(62);
    expect(parseOembedDuration({ video_duration: '90' })).toBe(90);
  });

  it('returns null when the length is missing or unusable', () => {
    expect(parseOembedDuration({ title: 'x' })).toBeNull();
    expect(parseOembedDuration({ duration: 0 })).toBeNull();
    expect(parseOembedDuration(null)).toBeNull();
    expect(parseOembedDuration('oops')).toBeNull();
  });
});

describe('parseYoutubeLength', () => {
  it('reads the player length or the ISO meta tag', () => {
    expect(parseYoutubeLength('..."videoId":"x","lengthSeconds":"212","keywords"...')).toBe(212);
    expect(parseYoutubeLength('<meta itemprop="duration" content="PT1H2M5S">')).toBe(3725);
    expect(parseYoutubeLength('<meta itemprop="duration" content="PT4M">')).toBe(240);
  });

  it('returns null for a consent or error page', () => {
    expect(parseYoutubeLength('<html>Before you continue to YouTube</html>')).toBeNull();
  });
});
