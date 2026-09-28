import { describe, expect, it } from 'vitest';
import {
  SIGNUP_PASS_TTL_SECONDS,
  issueSignupPass,
  passcodeMatches,
  readCookie,
  verifySignupPass,
} from './signupPass';

const SECRET = 'test-secret';

describe('passcodeMatches', () => {
  it('matches ignoring surrounding whitespace', async () => {
    expect(await passcodeMatches(' open-sesame ', 'open-sesame')).toBe(true);
  });

  it('rejects a different passcode', async () => {
    expect(await passcodeMatches('open-sesami', 'open-sesame')).toBe(false);
  });
});

describe('signup pass', () => {
  it('verifies a pass it issued', async () => {
    const pass = await issueSignupPass(SECRET, 'code-1');
    expect(await verifySignupPass(pass, SECRET, 'code-1')).toBe(true);
  });

  it('is revoked when the passcode changes', async () => {
    const pass = await issueSignupPass(SECRET, 'code-1');
    expect(await verifySignupPass(pass, SECRET, 'code-2')).toBe(false);
  });

  it('is rejected once signup is closed (no passcode)', async () => {
    const pass = await issueSignupPass(SECRET, 'code-1');
    expect(await verifySignupPass(pass, SECRET, null)).toBe(false);
  });

  it('expires', async () => {
    const issuedAt = Date.UTC(2026, 0, 1);
    const pass = await issueSignupPass(SECRET, 'code-1', issuedAt);
    const justBefore = issuedAt + (SIGNUP_PASS_TTL_SECONDS - 1) * 1000;
    const after = issuedAt + (SIGNUP_PASS_TTL_SECONDS + 1) * 1000;
    expect(await verifySignupPass(pass, SECRET, 'code-1', justBefore)).toBe(true);
    expect(await verifySignupPass(pass, SECRET, 'code-1', after)).toBe(false);
  });

  it('rejects a forged or tampered pass', async () => {
    const pass = await issueSignupPass(SECRET, 'code-1');
    const [expires, signature] = pass.split('.');
    expect(await verifySignupPass(`${Number(expires) + 3600}.${signature}`, SECRET, 'code-1')).toBe(false);
    expect(await verifySignupPass(pass, 'other-secret', 'code-1')).toBe(false);
    expect(await verifySignupPass('garbage', SECRET, 'code-1')).toBe(false);
    expect(await verifySignupPass(null, SECRET, 'code-1')).toBe(false);
  });
});

describe('readCookie', () => {
  it('finds a cookie among others', () => {
    expect(readCookie('a=1; signup_pass=123.abc; b=2', 'signup_pass')).toBe('123.abc');
    expect(readCookie('a=1', 'signup_pass')).toBeNull();
    expect(readCookie(null, 'signup_pass')).toBeNull();
  });
});
