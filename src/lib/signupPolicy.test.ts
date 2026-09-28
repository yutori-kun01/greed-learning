import { describe, expect, it } from 'vitest';
import { isSignupAllowed } from './signupPolicy';

const noPass = { hasValidPasscodePass: false };
const withPass = { hasValidPasscodePass: true };

describe('isSignupAllowed', () => {
  it('is closed by default', () => {
    expect(isSignupAllowed('anyone@example.com', {}, noPass)).toBe(false);
  });

  it('admits anyone who entered the passcode', () => {
    expect(isSignupAllowed('anyone@example.com', {}, withPass)).toBe(true);
  });

  it('always admits the bootstrap admin', () => {
    const env = { BOOTSTRAP_ADMIN_EMAIL: 'Owner@Example.com' };
    expect(isSignupAllowed('owner@example.com', env, noPass)).toBe(true);
    expect(isSignupAllowed('stranger@example.com', env, noPass)).toBe(false);
  });
});
