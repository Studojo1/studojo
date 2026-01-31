import { desc, eq } from "drizzle-orm";
import { getSessionFromRequest } from "~/lib/onboarding.server";
import db from "~/lib/db";
import { resumes } from "../../auth-schema";
import type { Route } from "./+types/api.resumes";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const userResumes = await db
    .select()
    .from(resumes)
    .where(eq(resumes.userId, session.user.id))
    .orderBy(desc(resumes.createdAt));

  return new Response(
    JSON.stringify({
      resumes: userResumes.map((r) => ({
        id: r.id,
        userId: r.userId,
        name: r.name,
        resumeData: r.resumeData,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

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

  const { name, resumeData } = body as { name?: unknown; resumeData?: unknown };

  if (typeof name !== "string" || !name.trim()) {
    return new Response(
      JSON.stringify({ error: "Name is required and must be a string" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!resumeData || typeof resumeData !== "object") {
    return new Response(
      JSON.stringify({ error: "resumeData is required and must be an object" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const [newResume] = await db
    .insert(resumes)
    .values({
      userId: session.user.id,
      name: name.trim(),
      resumeData: resumeData as any,
    })
    .returning();

  return new Response(
    JSON.stringify({
      resume: {
        id: newResume.id,
        userId: newResume.userId,
        name: newResume.name,
        resumeData: newResume.resumeData,
        createdAt: newResume.createdAt.toISOString(),
        updatedAt: newResume.updatedAt.toISOString(),
      },
    }),
    { status: 201, headers: { "Content-Type": "application/json" } }
  );
}
