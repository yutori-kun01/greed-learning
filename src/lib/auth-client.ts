import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [
    inferAdditionalFields({
      user: {
        role: { type: "string", required: false },
        currentStreak: { type: "number", required: false },
        longestStreak: { type: "number", required: false },
        lastActivityDate: { type: "string", required: false },
        stripeCustomerId: { type: "string", required: false },
        noteId: { type: "string", required: false },
        xId: { type: "string", required: false },
        themePreference: { type: "string", required: false },
      },
    }),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
