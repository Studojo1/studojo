import type { Route } from "./+types/api.auth.share-token-redirect";
import { auth } from "~/lib/auth";

/**
 * Redirect-based token sharing endpoint
 * GET /api/auth/share-token-redirect?redirect=<admin-panel-url>
 * 
 * This endpoint:
 * 1. Checks if user is authenticated
 * 2. Gets the JWT token
 * 3. Redirects back to admin panel with token in URL fragment
 */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("redirect");
  
  if (!redirectTo) {
    return Response.json({ error: "redirect parameter required" }, { status: 400 });
  }

  try {
    // Get session
    const sessionResponse = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionResponse || !sessionResponse.user) {
      // Redirect to login with return URL
      const loginUrl = new URL("/auth", request.url);
      loginUrl.searchParams.set("redirect", request.url);
      return Response.redirect(loginUrl.toString(), 302);
    }

    // Get JWT token
    let jwtToken: string | null = null;
    
    try {
      const tokenResult = await auth.api.getAccessToken({
        headers: request.headers,
      });
      jwtToken = (tokenResult as any)?.token || (tokenResult as any)?.accessToken || null;
    } catch (e) {
      console.debug("Could not get token via getAccessToken:", e);
    }
    
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

    if (!jwtToken) {
      return Response.json({ 
        error: "JWT token not available"
      }, { status: 401 });
    }

    // Redirect to admin panel with token in URL fragment
    // The admin panel will extract it and store it
    const redirectUrl = new URL(redirectTo);
    redirectUrl.hash = `token=${encodeURIComponent(jwtToken)}`;
    
    return Response.redirect(redirectUrl.toString(), 302);
  } catch (error: any) {
    console.error("Error in share-token-redirect:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

