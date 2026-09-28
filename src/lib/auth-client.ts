import { createAuthClient } from "better-auth/react";

// No baseURL: the client then talks to the origin the page was served from.
// Pinning it to NEXT_PUBLIC_APP_URL baked a localhost fallback into the
// production bundle whenever that variable was missing at build time, so
// every sign-in from the deployed site went to the visitor's own machine.
export const authClient = createAuthClient();

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  changePassword,
  changeEmail,
  requestPasswordReset,
  resetPassword,
} = authClient;
