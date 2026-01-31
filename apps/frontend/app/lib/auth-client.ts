import { passkeyClient } from "@better-auth/passkey/client";
import {
  adminClient,
  jwtClient,
  lastLoginMethodClient,
  phoneNumberClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined" ? window.location.origin : "",
  plugins: [
    lastLoginMethodClient(),
    jwtClient(),
    adminClient(),
    passkeyClient(),
    phoneNumberClient(),
    twoFactorClient({
      onTwoFactorRedirect: () => {
        if (typeof window !== "undefined") {
          window.location.href = "/auth/2fa";
        }
      },
    }),
  ],
});
