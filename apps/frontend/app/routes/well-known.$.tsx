import type { Route } from "./+types/well-known.$";

/**
 * Handle /.well-known/* (e.g. Chrome DevTools' /.well-known/appspecific/com.chrome.devtools.json).
 * Return 404 so the app doesn't throw "No route matches" and spam the console.
 */
export async function loader(_args: Route.LoaderArgs) {
  return new Response(null, { status: 404 });
}

export default function WellKnown() {
  return null;
}
