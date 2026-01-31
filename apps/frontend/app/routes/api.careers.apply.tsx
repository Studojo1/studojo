import { eq } from "drizzle-orm";
import db from "~/lib/db";
import * as schema from "../../auth-schema";
import type { Route } from "./+types/api.careers.apply";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
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

  const data = body as {
    name?: string;
    phoneNumber?: string;
    countryCode?: string;
    fullPhoneNumber?: string;
    city?: string;
    institutionName?: string;
    currentYear?: string;
    course?: string;
    email?: string;
    areasOfInterest?: string[];
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
  };

  // Validation
  if (!data.name?.trim()) {
    return new Response(
      JSON.stringify({ error: "Name is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (!data.city?.trim()) {
    return new Response(
      JSON.stringify({ error: "City is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (!data.institutionName?.trim()) {
    return new Response(
      JSON.stringify({ error: "Institution name is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (!data.currentYear?.trim()) {
    return new Response(
      JSON.stringify({ error: "Current year is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (!data.course?.trim()) {
    return new Response(
      JSON.stringify({ error: "Course is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (!data.email?.trim() || !data.email.includes("@")) {
    return new Response(
      JSON.stringify({ error: "Valid email is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (!data.areasOfInterest || data.areasOfInterest.length === 0) {
    return new Response(
      JSON.stringify({ error: "At least one area of interest is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const phoneNumber = data.fullPhoneNumber || (data.countryCode + data.phoneNumber);
  if (!phoneNumber || phoneNumber.length < 10) {
    return new Response(
      JSON.stringify({ error: "Valid phone number is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Check phone number uniqueness
  const existingUser = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.phoneNumber, phoneNumber))
    .limit(1)
    .then((users) => users[0]);

  if (existingUser) {
    return new Response(
      JSON.stringify({ error: "This phone number is already registered" }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }

  // Check if phone number already used in career applications
  const existingApplication = await db
    .select()
    .from(schema.careerApplications)
    .where(eq(schema.careerApplications.phoneNumber, phoneNumber))
    .limit(1)
    .then((applications) => applications[0]);

  if (existingApplication) {
    return new Response(
      JSON.stringify({ error: "This phone number has already been used for an application" }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }

  // Determine payment status
  const paymentStatus = data.razorpayPaymentId ? "completed" : "pending";
  const amount = 99900; // ₹999 in paise

  // Store application
  try {
    const [application] = await db
      .insert(schema.careerApplications)
      .values({
        name: data.name.trim(),
        email: data.email.trim(),
        phoneNumber: phoneNumber,
        city: data.city.trim(),
        institutionName: data.institutionName.trim(),
        currentYear: data.currentYear.trim(),
        course: data.course.trim(),
        areasOfInterest: data.areasOfInterest,
        formData: {
          name: data.name.trim(),
          email: data.email.trim(),
          phoneNumber: phoneNumber,
          city: data.city.trim(),
          institutionName: data.institutionName.trim(),
          currentYear: data.currentYear.trim(),
          course: data.course.trim(),
          areasOfInterest: data.areasOfInterest,
        },
        razorpayOrderId: data.razorpayOrderId || null,
        razorpayPaymentId: data.razorpayPaymentId || null,
        paymentStatus: paymentStatus,
        amount: amount,
        status: "submitted",
      })
      .returning();

    return new Response(
      JSON.stringify({
        application: {
          id: application.id,
          email: application.email,
          status: application.status,
          paymentStatus: application.paymentStatus,
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Failed to create career application:", error);
    if (error?.code === "23505" && error?.constraint?.includes("phone_number")) {
      return new Response(
        JSON.stringify({ error: "This phone number has already been used" }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({ error: "Failed to create application" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

