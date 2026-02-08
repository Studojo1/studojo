import { jwtVerify, createRemoteJWKSet } from "jose";

const JWKS_URL =
  process.env.JWKS_URL || process.env.VITE_AUTH_URL
    ? `${process.env.VITE_AUTH_URL || "http://localhost:3000"}/api/auth/jwks`
    : "http://localhost:3000/api/auth/jwks";

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(JWKS_URL));
  }
  return jwks;
}

export async function verifyToken(token: string): Promise<string | null> {
  try {
    const jwksSet = getJWKS();
    const { payload } = await jwtVerify(token, jwksSet, {
      algorithms: ["RS256", "ES256", "EdDSA"],
    });

    const userId = payload.sub || (payload as any).userId;
    if (!userId || typeof userId !== "string") {
      return null;
    }

    return userId;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("JWT verification failed:", error);
    }
    return null;
  }
}

