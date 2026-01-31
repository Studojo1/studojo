import { getProfileStatus, getSessionFromRequest } from "~/lib/onboarding.server";
import type { Route } from "./+types/api.onboarding.status";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  const status = await getProfileStatus(session.user.id);
  return Response.json(status);
}
