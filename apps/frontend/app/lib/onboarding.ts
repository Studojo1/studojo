// Client-safe onboarding utilities (types and validation only)
// Server-only functions are in onboarding.server.ts

const MAX_LENGTH = 200;

export type OnboardingProfile = {
  id: string;
  userId: string;
  fullName: string;
  college: string;
  yearOfStudy: string;
  course: string;
  createdAt: Date;
  updatedAt: Date;
};

// Client-safe validation function (no database or auth dependencies)
export function validateOnboardingBody(body: {
  fullName?: unknown;
  college?: unknown;
  yearOfStudy?: unknown;
  course?: unknown;
}): { ok: true; data: { fullName: string; college: string; yearOfStudy: string; course: string } } | { ok: false; error: string } {
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const college = typeof body.college === "string" ? body.college.trim() : "";
  const yearOfStudy = typeof body.yearOfStudy === "string" ? body.yearOfStudy.trim() : "";
  const course = typeof body.course === "string" ? body.course.trim() : "";

  if (!fullName) return { ok: false, error: "Full name is required." };
  if (fullName.length > MAX_LENGTH) return { ok: false, error: "Full name is too long." };
  if (!college) return { ok: false, error: "College/University is required." };
  if (college.length > MAX_LENGTH) return { ok: false, error: "College/University is too long." };
  if (!yearOfStudy) return { ok: false, error: "Year of study is required." };
  if (yearOfStudy.length > MAX_LENGTH) return { ok: false, error: "Year of study is too long." };
  if (!course) return { ok: false, error: "Course/Major is required." };
  if (course.length > MAX_LENGTH) return { ok: false, error: "Course/Major is too long." };

  return { ok: true, data: { fullName, college, yearOfStudy, course } };
}
