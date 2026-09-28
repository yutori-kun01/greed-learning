import { describe, expect, it } from 'vitest';
import { isSignupAllowed, isSignupRestricted, parseEmailList } from './signupPolicy';

describe('parseEmailList', () => {
  it('splits, trims, lowercases and drops blanks', () => {
    expect(parseEmailList(' A@x.com, ,b@Y.com ,')).toEqual(['a@x.com', 'b@y.com']);
  });

  it('treats unset as empty', () => {
    expect(parseEmailList(undefined)).toEqual([]);
  });
});

describe('isSignupAllowed', () => {
  it('is open when no allowlist is configured', () => {
    expect(isSignupRestricted({})).toBe(false);
    expect(isSignupAllowed('anyone@example.com', {})).toBe(true);
    expect(isSignupAllowed('anyone@example.com', { ALLOWED_SIGNUP_EMAILS: ' , ' })).toBe(true);
  });

  it('admits only listed addresses once an allowlist is set', () => {
    const env = { ALLOWED_SIGNUP_EMAILS: 'me@example.com,friend@example.com' };
    expect(isSignupAllowed('me@example.com', env)).toBe(true);
    expect(isSignupAllowed('FRIEND@example.com ', env)).toBe(true);
    expect(isSignupAllowed('stranger@example.com', env)).toBe(false);
  });

  it('always admits the bootstrap admin while restricted', () => {
    const env = { ALLOWED_SIGNUP_EMAILS: 'friend@example.com', BOOTSTRAP_ADMIN_EMAIL: 'Owner@Example.com' };
    expect(isSignupAllowed('owner@example.com', env)).toBe(true);
    expect(isSignupAllowed('stranger@example.com', env)).toBe(false);
  });
});
