import { describe, expect, it } from 'vitest';
import { openSecret, sealSecret } from './secretBox';

describe('secretBox', () => {
  it('round-trips a value', async () => {
    const sealed = await sealSecret('re_abc123', 'server-secret');
    expect(sealed.startsWith('v1.')).toBe(true);
    expect(sealed).not.toContain('re_abc123');
    expect(await openSecret(sealed, 'server-secret')).toBe('re_abc123');
  });

  it('uses a fresh IV each time', async () => {
    const a = await sealSecret('same', 'server-secret');
    const b = await sealSecret('same', 'server-secret');
    expect(a).not.toBe(b);
  });

  it('cannot be opened with another secret', async () => {
    const sealed = await sealSecret('re_abc123', 'server-secret');
    expect(await openSecret(sealed, 'other-secret')).toBeNull();
  });

  it('rejects tampered or foreign values', async () => {
    const sealed = await sealSecret('re_abc123', 'server-secret');
    const [v, iv, data] = sealed.split('.');
    const flipped = data.slice(0, -2) + (data.at(-2) === 'A' ? 'B' : 'A') + data.at(-1);
    expect(await openSecret(`${v}.${iv}.${flipped}`, 'server-secret')).toBeNull();
    expect(await openSecret('re_plaintext_key', 'server-secret')).toBeNull();
    expect(await openSecret(null, 'server-secret')).toBeNull();
  });

  it('refuses to encrypt without a server secret', async () => {
    await expect(sealSecret('x', '')).rejects.toThrow();
  });
});
