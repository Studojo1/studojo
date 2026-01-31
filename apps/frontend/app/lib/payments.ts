import { authClient } from "./auth-client";

export function getControlPlaneUrl(): string {
  const url = import.meta.env?.VITE_CONTROL_PLANE_URL;
  if (typeof url === "string" && url) {
    return url;
  }
  // In production, default to api.studojo.pro
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname.includes("studojo.pro") || hostname.includes("studojo.com")) {
      return "https://api.studojo.pro";
    }
  }
  // Development fallback
  return "http://localhost:8080";
}

export async function getToken(): Promise<string | null> {
  const { data, error } = await authClient.token();
  if (error || !data?.token) return null;
  return data.token;
}

/** Payment order creation request. */
export interface CreateOrderRequest {
  amount: number; // Amount in paise (e.g., 13900 for ₹139)
}

/** Payment order creation response. */
export interface CreateOrderResponse {
  order_id: string;
  amount: number;
  key_id: string;
}

/** Payment verification request. */
export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  job_id?: string;
}

/** Payment verification response. */
export interface VerifyPaymentResponse {
  payment_id: string;
  status: string;
  job_id?: string;
}

/** Control plane API error body. */
export interface ApiError {
  error?: { code?: string; message?: string };
}

export class PaymentError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: ApiError
  ) {
    super(message);
    this.name = "PaymentError";
  }
}

/** Create a Razorpay payment order. */
export async function createPaymentOrder(amount: number): Promise<CreateOrderResponse> {
  const token = await getToken();
  if (!token) throw new PaymentError("No token", 401);

  const base = getControlPlaneUrl();
  const res = await fetch(`${base}/v1/payments/create-order`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount }),
  });

  const data = (await res.json()) as CreateOrderResponse | ApiError;
  if (!res.ok) {
    const err = data as ApiError;
    throw new PaymentError(
      err?.error?.message ?? "Failed to create payment order",
      res.status,
      err
    );
  }
  return data as CreateOrderResponse;
}

/** Verify Razorpay payment. */
export async function verifyPayment(
  orderId: string,
  paymentId: string,
  signature: string,
  jobId?: string
): Promise<VerifyPaymentResponse> {
  const token = await getToken();
  if (!token) throw new PaymentError("No token", 401);

  const base = getControlPlaneUrl();
  const res = await fetch(`${base}/v1/payments/verify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      job_id: jobId,
    }),
  });

  const data = (await res.json()) as VerifyPaymentResponse | ApiError;
  if (!res.ok) {
    const err = data as ApiError;
    throw new PaymentError(
      err?.error?.message ?? "Payment verification failed",
      res.status,
      err
    );
  }
  return data as VerifyPaymentResponse;
}

/** Load Razorpay script dynamically. */
export function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay script"));
    document.body.appendChild(script);
  });
}

/** Open Razorpay checkout. */
export async function openRazorpayCheckout(
  options: {
    key: string;
    amount: number;
    currency?: string;
    name?: string;
    description?: string;
    order_id?: string; // Optional - if not provided, Razorpay creates order automatically
    handler: (response: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) => void;
    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };
    theme?: {
      color?: string;
    };
    onDismiss?: () => void; // Callback when user closes modal
    onPaymentFailed?: (response: any) => void; // Callback when payment fails
  }
): Promise<void> {
  await loadRazorpayScript();

  if (!window.Razorpay) {
    throw new Error("Razorpay not loaded");
  }

  // Wrap the handler to ensure proper response handling
  const wrappedHandler = (response: any) => {
    console.log("Razorpay raw handler response:", response);
    console.log("Response type:", typeof response);
    console.log("Response is array:", Array.isArray(response));
    
    // Ensure we pass the response as-is to the original handler
    if (options.handler) {
      options.handler(response);
    }
  };

  const rzpOptions: any = {
    key: options.key,
    amount: options.amount,
    currency: options.currency || "INR",
    name: options.name || "Studojo",
    description: options.description || "Assignment Generation",
    handler: wrappedHandler,
    prefill: options.prefill,
    theme: options.theme || { color: "#7c3aed" }, // violet-500
    modal: {
      ondismiss: options.onDismiss || (() => {
        // User closed the modal
      }),
    },
  };

  // Add order_id if provided (for server-side order creation)
  // This ensures Razorpay uses the server-created order
  if (options.order_id) {
    rzpOptions.order_id = options.order_id;
  }

  const rzp = new window.Razorpay(rzpOptions);
  
  // Set up error handler for payment failures
  if (options.onPaymentFailed) {
    rzp.on("payment.failed", (response: any) => {
      options.onPaymentFailed!(response);
    });
  }
  
  rzp.open();
}

// Extend Window interface for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}
