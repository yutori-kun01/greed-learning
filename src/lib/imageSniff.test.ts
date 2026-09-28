import { describe, expect, it } from 'vitest';
import { sniffImage } from './imageSniff';

const bytes = (...b: number[]) => new Uint8Array(b);

describe('sniffImage', () => {
  it('recognises the supported formats by signature', () => {
    expect(sniffImage(bytes(0xff, 0xd8, 0xff, 0xe0))?.mime).toBe('image/jpeg');
    expect(sniffImage(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))?.mime).toBe('image/png');
    expect(sniffImage(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61))?.mime).toBe('image/gif');
    expect(
      sniffImage(bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50))?.mime
    ).toBe('image/webp');
  });

  it('rejects HTML, SVG and truncated input whatever they claim to be', () => {
    const text = (s: string) => new TextEncoder().encode(s);
    expect(sniffImage(text('<!doctype html><script>alert(1)</script>'))).toBeNull();
    expect(sniffImage(text('<svg xmlns="http://www.w3.org/2000/svg" onload="x"/>'))).toBeNull();
    expect(sniffImage(bytes(0x89, 0x50))).toBeNull();
    expect(sniffImage(bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x41, 0x56, 0x49, 0x20))).toBeNull();
  });
});
