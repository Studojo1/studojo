import { validateOnboardingBody } from "~/lib/onboarding";
import { createProfile, getProfileStatus, getSessionFromRequest } from "~/lib/onboarding.server";
import type { Route } from "./+types/api.onboarding";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }
  const session = await getSessionFromRequest(request);
  if (!session) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const validated = validateOnboardingBody(body as Record<string, unknown>);
  if (!validated.ok) {
    return new Response(
      JSON.stringify({ error: validated.error }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const existing = await getProfileStatus(session.user.id);
  if (existing.completed) {
    return new Response(
      JSON.stringify({ error: "Profile already exists" }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }
  const profile = await createProfile(session.user.id, validated.data);
  return new Response(
    JSON.stringify({
      profile: {
        id: profile.id,
        userId: profile.userId,
        fullName: profile.fullName,
        college: profile.college,
        yearOfStudy: profile.yearOfStudy,
        course: profile.course,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
    }),
    { status: 201, headers: { "Content-Type": "application/json" } }
  );
}
