import { describe, it, expect } from 'vitest';
import { akinaiConfig, parseProductIds, verifyAkinaiSignature } from './akinai';
import { createHmac } from 'node:crypto';

const sign = (secret: string, body: string, t: number) =>
  `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${body}`).digest('hex')}`;

describe('verifyAkinaiSignature', () => {
  const secret = 'akh_cs_' + 'a'.repeat(64);
  const body = JSON.stringify({ id: 'hook:1', type: 'entitlement.granted' });
  const now = 1_800_000_000_000;
  const t = now / 1000;

  it('accepts a fresh signature over the exact body', async () => {
    await expect(verifyAkinaiSignature(sign(secret, body, t), body, secret, now)).resolves.toBe(true);
  });

  it('rejects a changed body, another secret, a stale timestamp and junk', async () => {
    await expect(verifyAkinaiSignature(sign(secret, body, t), body + ' ', secret, now)).resolves.toBe(false);
    await expect(verifyAkinaiSignature(sign('other', body, t), body, secret, now)).resolves.toBe(false);
    await expect(verifyAkinaiSignature(sign(secret, body, t - 301), body, secret, now)).resolves.toBe(false);
    await expect(verifyAkinaiSignature('t=1,v1=zz', body, secret, now)).resolves.toBe(false);
    await expect(verifyAkinaiSignature(null, body, secret, now)).resolves.toBe(false);
  });
});

describe('parseProductIds / akinaiConfig', () => {
  it('reads a JSON array of ids and nothing else', () => {
    expect(parseProductIds('["a","b",3,""]')).toEqual(['a', 'b']);
    expect(parseProductIds('{"a":1}')).toEqual([]);
    expect(parseProductIds('nope')).toEqual([]);
    expect(parseProductIds(null)).toEqual([]);
  });

  it('needs an https issuer and both client credentials', () => {
    expect(akinaiConfig({ AKINAI_ISSUER: 'https://store.test/', AKINAI_CLIENT_ID: 'id', AKINAI_CLIENT_SECRET: 's' })).toEqual({ issuer: 'https://store.test', clientId: 'id', clientSecret: 's' });
    expect(akinaiConfig({ AKINAI_ISSUER: 'http://store.test', AKINAI_CLIENT_ID: 'id', AKINAI_CLIENT_SECRET: 's' })).toBeNull();
    expect(akinaiConfig({ AKINAI_ISSUER: 'https://store.test' })).toBeNull();
  });
});
