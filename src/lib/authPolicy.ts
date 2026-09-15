/**
 * Whether new accounts must confirm their email address before they can sign
 * in. Off by default so existing deployments keep working; operators turn it
 * on with REQUIRE_EMAIL_VERIFICATION=true.
 *
 * It is deliberately ignored when transactional email is not configured —
 * otherwise nobody could ever receive the confirmation link and every new
 * account would be locked out.
 */
export function isEmailVerificationRequired(): boolean {
  if (process.env.REQUIRE_EMAIL_VERIFICATION !== 'true') return false;

  const emailConfigured = !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
  if (!emailConfigured) {
    console.warn(
      '[auth] REQUIRE_EMAIL_VERIFICATION=true but RESEND_API_KEY/RESEND_FROM_EMAIL are not set — ignoring it so new accounts are not locked out.'
    );
    return false;
  }

  return true;
}

/** Exposed to the signup screen so it can say what happens next. */
export const EMAIL_VERIFICATION_ENV = 'REQUIRE_EMAIL_VERIFICATION';
