import { eq } from "drizzle-orm";
import db from "~/lib/db";
import * as schema from "../../auth-schema";
import type { Route } from "./+types/api.dissertation";

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
    dissertationTitle?: string;
    dataType?: string;
    currentStage?: string;
    email?: string;
    phoneNumber?: string;
    countryCode?: string;
    fullPhoneNumber?: string;
    additionalNotes?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
  };

  // Validation
  if (!data.dissertationTitle?.trim()) {
    return new Response(
      JSON.stringify({ error: "Dissertation title is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (!data.dataType || (data.dataType !== "primary" && data.dataType !== "secondary")) {
    return new Response(
      JSON.stringify({ error: "Valid data type is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (!data.currentStage?.trim()) {
    return new Response(
      JSON.stringify({ error: "Current stage is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (!data.email?.trim() || !data.email.includes("@")) {
    return new Response(
      JSON.stringify({ error: "Valid email is required" }),
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

  // Check if phone number already used in dissertation submissions
  const existingSubmission = await db
    .select()
    .from(schema.dissertationSubmissions)
    .where(eq(schema.dissertationSubmissions.phoneNumber, phoneNumber))
    .limit(1)
    .then((submissions) => submissions[0]);

  if (existingSubmission) {
    return new Response(
      JSON.stringify({ error: "This phone number has already been used for a submission" }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }

  // Determine payment status
  const paymentStatus = data.razorpayPaymentId ? "completed" : "pending";
  const amount = 350000; // ₹3,500 in paise

  // Store submission
  try {
    const [submission] = await db
      .insert(schema.dissertationSubmissions)
      .values({
        name: data.email.split("@")[0] || "User", // Use email prefix as name
        email: data.email.trim(),
        phoneNumber: phoneNumber,
        dissertationTitle: data.dissertationTitle.trim(),
        dataType: data.dataType,
        currentStage: data.currentStage.trim(),
        additionalNotes: data.additionalNotes?.trim() || null,
        formData: {
          dissertationTitle: data.dissertationTitle.trim(),
          dataType: data.dataType,
          currentStage: data.currentStage.trim(),
          email: data.email.trim(),
          phoneNumber: phoneNumber,
          additionalNotes: data.additionalNotes?.trim() || null,
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
        submission: {
          id: submission.id,
          email: submission.email,
          status: submission.status,
          paymentStatus: submission.paymentStatus,
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Failed to create dissertation submission:", error);
    if (error?.code === "23505" && error?.constraint?.includes("phone_number")) {
      return new Response(
        JSON.stringify({ error: "This phone number has already been used" }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({ error: "Failed to create submission" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

