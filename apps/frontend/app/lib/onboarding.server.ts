// Server-only file for onboarding utilities that need auth or database
// This file should NEVER be imported in client-side code

import { eq } from "drizzle-orm";
import { auth } from "~/lib/auth";
import db from "./db";
import { userProfile, user } from "../../auth-schema";

export async function getSessionFromRequest(request: { headers: Headers }) {
  return auth.api.getSession({
    headers: request.headers,
  });
}

export async function getProfileStatus(userId: string) {
  const rows = await db
    .select()
    .from(userProfile)
    .where(eq(userProfile.userId, userId))
    .limit(1);
  const profile = rows[0] ?? null;
  return {
    completed: !!profile,
    profile: profile
      ? {
          id: profile.id,
          userId: profile.userId,
          fullName: profile.fullName,
          college: profile.college,
          yearOfStudy: profile.yearOfStudy,
          course: profile.course,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
        }
      : null,
  };
}

/**
 * Check if user has verified phone number and completed profile
 * Returns an object indicating what's missing
 */
export async function requireOnboardingComplete(userId: string) {
  // Get user to check phone number
  const [userRecord] = await db
    .select({
      phoneNumber: user.phoneNumber,
      phoneNumberVerified: user.phoneNumberVerified,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!userRecord) {
    return {
      complete: false,
      hasPhone: false,
      hasProfile: false,
      missing: ["phone", "profile"] as const,
    };
  }

  // Check phone number
  const hasPhone = !!(
    userRecord.phoneNumber &&
    userRecord.phoneNumberVerified
  );

  // Check profile
  const profileStatus = await getProfileStatus(userId);
  const hasProfile = profileStatus.completed;

  const missing: Array<"phone" | "profile"> = [];
  if (!hasPhone) missing.push("phone");
  if (!hasProfile) missing.push("profile");

  return {
    complete: hasPhone && hasProfile,
    hasPhone,
    hasProfile,
    missing: missing as readonly ("phone" | "profile")[],
  };
}

export async function createProfile(
  userId: string,
  data: { fullName: string; college: string; yearOfStudy: string; course: string }
) {
  const id = crypto.randomUUID();
  await db.insert(userProfile).values({
    id,
    userId,
    fullName: data.fullName,
    college: data.college,
    yearOfStudy: data.yearOfStudy,
    course: data.course,
  });
  const [row] = await db.select().from(userProfile).where(eq(userProfile.id, id)).limit(1);
  return row!;
}

