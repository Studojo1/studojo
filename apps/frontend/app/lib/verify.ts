/**
 * Twilio Verify API verification check helper.
 * Verifies OTP codes using Twilio Verify API's verification check endpoint.
 */

import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();

function isConfigured(): boolean {
  return !!(accountSid && authToken && verifyServiceSid);
}

export type VerificationStatus = "approved" | "pending" | "canceled" | "max_attempts_reached" | "expired" | "failed";

export interface VerificationResult {
  status: VerificationStatus;
  valid: boolean;
  error?: string;
}

/**
 * Verify an OTP code using Twilio Verify API.
 * 
 * @param phoneNumber - The phone number to verify
 * @param code - The OTP code entered by the user
 * @param verificationSid - Optional verification SID. If not provided, will attempt to find it.
 * @returns Verification result with status and validity
 */
export async function verifyOtpCode(
  phoneNumber: string,
  code: string,
  verificationSid?: string
): Promise<VerificationResult> {
  if (!isConfigured()) {
    return {
      status: "failed",
      valid: false,
      error: "Twilio Verify API not configured",
    };
  }

  if (!verificationSid) {
    return {
      status: "failed",
      valid: false,
      error: "Verification SID not found. Please request a new code.",
    };
  }

  const client = twilio(accountSid, authToken);

  try {
    const verificationCheck = await client.verify.v2
      .services(verifyServiceSid!)
      .verificationChecks.create({
        to: phoneNumber,
        code,
      });

    const status = verificationCheck.status as VerificationStatus;
    const valid = status === "approved";

    return {
      status,
      valid,
      error: valid ? undefined : `Verification ${status}`,
    };
  } catch (err: any) {
    console.error("[verify] Failed to verify code:", err);
    
    // Handle specific Twilio error codes
    if (err.code === 20404) {
      return {
        status: "failed",
        valid: false,
        error: "Verification not found. Please request a new code.",
      };
    }

    return {
      status: "failed",
      valid: false,
      error: err.message || "Verification failed",
    };
  }
}
