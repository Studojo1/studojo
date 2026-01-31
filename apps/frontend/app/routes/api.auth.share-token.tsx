import type { Route } from "./+types/api.auth.share-token";
import { auth } from "~/lib/auth";

/**
 * API endpoint to share authentication token with admin panel
 * This allows the admin panel to get a JWT token from the frontend's session
 * GET /api/auth/share-token
 * 
 * This works like an OAuth token exchange - the admin panel requests a token
 * and if the user is authenticated in the frontend, we share the token.
 */
export async function loader({ request }: Route.LoaderArgs) {
  // Handle OPTIONS preflight request
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("origin");
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin || "http://localhost:3001,http://localhost:3002",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }
  
  // Check if request is from admin panel or maverick (allow localhost:3001, :3002 or admin/maverick subdomain)
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const isAllowedApp = 
    origin?.includes(":3001") || 
    origin?.includes(":3002") ||
    origin?.includes("admin") ||
    origin?.includes("maverick") ||
    referer?.includes(":3001") ||
    referer?.includes(":3002") ||
    referer?.includes("admin") ||
    referer?.includes("maverick") ||
    request.headers.get("user-agent")?.includes("admin") ||
    request.headers.get("user-agent")?.includes("maverick");
  
  if (!isAllowedApp) {
    return Response.json({ error: "Unauthorized origin" }, { 
      status: 403,
      headers: {
        "Access-Control-Allow-Origin": origin || "*",
      },
    });
  }

  try {
    // Get session using Better Auth's server-side API
    const sessionResponse = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionResponse || !sessionResponse.user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Better Auth's JWT plugin generates tokens on-demand
    // We can get the token by calling the token endpoint via Better Auth's API
    // The JWT plugin exposes tokens through the session
    let jwtToken: string | null = null;
    
    try {
      // Try to get token via Better Auth's internal API
      // The jwt() plugin should provide access to tokens
      const tokenResult = await auth.api.getAccessToken({
        headers: request.headers,
      });
      
      jwtToken = (tokenResult as any)?.token || (tokenResult as any)?.accessToken || null;
    } catch (e) {
      console.debug("Could not get token via getAccessToken:", e);
    }
    
    // If that didn't work, try calling the token endpoint directly
    if (!jwtToken) {
      try {
        const tokenUrl = new URL("/api/auth/token", request.url);
        const tokenRequest = new Request(tokenUrl.toString(), {
          method: "GET",
          headers: request.headers,
        });
        
        const tokenResponse = await auth.handler(tokenRequest);
        if (tokenResponse) {
          const tokenData = await tokenResponse.json();
          jwtToken = tokenData?.token || tokenData?.accessToken || tokenData?.data?.token || null;
        }
      } catch (e) {
        console.debug("Could not get token via handler:", e);
      }
    }

    // If we still don't have a token, the user needs to sign in
    if (!jwtToken) {
      return Response.json({ 
        error: "JWT token not available. Please sign in to the main application first.",
        hint: "Make sure you're logged in at http://localhost:3000 before accessing the admin panel."
      }, { status: 401 });
    }

    // Return token and user info
    return Response.json({
      token: jwtToken,
      user: sessionResponse.user,
    }, {
      headers: {
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Credentials": "true",
      },
    });
  } catch (error: any) {
    console.error("Error sharing token:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

