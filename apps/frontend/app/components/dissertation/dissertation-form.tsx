import { useState } from "react";
import { toast } from "sonner";
import { PhoneInput } from "~/components/phone-input";
import { createPaymentOrder, openRazorpayCheckout, verifyPayment } from "~/lib/payments";
import { trackEvent } from "~/lib/mixpanel";
import { authClient } from "~/lib/auth-client";

interface DissertationFormData {
  dissertationTitle: string;
  dataType: "primary" | "secondary" | "";
  currentStage: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  additionalNotes: string;
}

const CURRENT_STAGES = [
  "Select your stage",
  "Just starting",
  "Literature review",
  "Data collection",
  "Data analysis",
  "Writing",
  "Final revisions",
] as const;

export function DissertationForm() {
  const [formData, setFormData] = useState<DissertationFormData>({
    dissertationTitle: "",
    dataType: "",
    currentStage: "",
    email: "",
    phoneNumber: "",
    countryCode: "+91",
    additionalNotes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.dissertationTitle.trim()) {
      toast.error("Please enter your dissertation title");
      return;
    }
    if (!formData.dataType) {
      toast.error("Please select data type");
      return;
    }
    if (!formData.currentStage || formData.currentStage === "Select your stage") {
      toast.error("Please select your current stage");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!formData.phoneNumber.trim()) {
      toast.error("Please enter your phone number");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create payment order
      const amount = 350000; // ₹3,500 in paise
      const { order_id, key_id } = await createPaymentOrder(amount);

      // Store form data temporarily (we'll save it after payment verification)
      const submissionData = {
        ...formData,
        fullPhoneNumber: formData.countryCode + formData.phoneNumber,
        paymentOrderId: order_id,
      };

      // Open Razorpay checkout
      setPaymentProcessing(true);
      await openRazorpayCheckout({
        key: key_id,
        amount,
        currency: "INR",
        name: "Studojo",
        description: "Dissertation Copilot Service",
        order_id: order_id,
        handler: async (response) => {
          try {
            // Verify payment
            const verifyResult = await verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            if (verifyResult.status === "completed") {
              // Track purchase event
              const session = authClient.getSession();
              const amountInRupees = amount / 100; // Convert paise to rupees
              trackEvent("Purchase", {
                user_id: session?.user?.id,
                transaction_id: response.razorpay_payment_id,
                revenue: amountInRupees,
                currency: "INR",
              });
              // Submit form data to API
              const apiResponse = await fetch("/api/dissertation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...submissionData,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                }),
              });

              if (!apiResponse.ok) {
                const error = await apiResponse.json();
                throw new Error(error.error || "Failed to submit form");
              }

              toast.success("Payment successful! Your submission has been received.");
              // Reset form
              setFormData({
                dissertationTitle: "",
                dataType: "",
                currentStage: "",
                email: "",
                phoneNumber: "",
                countryCode: "+91",
                additionalNotes: "",
              });
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (error: any) {
            console.error("Payment verification error:", error);
            toast.error(error.message || "Payment verification failed");
          } finally {
            setPaymentProcessing(false);
            setIsSubmitting(false);
          }
        },
        onDismiss: () => {
          setPaymentProcessing(false);
          setIsSubmitting(false);
        },
        onPaymentFailed: (response) => {
          console.error("Payment failed:", response);
          toast.error("Payment failed. Please try again.");
          setPaymentProcessing(false);
          setIsSubmitting(false);
        },
      });
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast.error(error.message || "Failed to process payment");
      setIsSubmitting(false);
      setPaymentProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="rounded-2xl bg-white p-6 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] outline outline-2 outline-offset-[-2px] outline-black md:p-8">
        <div className="flex flex-col gap-6">
          {/* Dissertation Title */}
          <div className="flex flex-col gap-2">
            <label className="font-['Satoshi'] text-sm font-medium leading-5 text-neutral-950">
              Dissertation Title / Topic
            </label>
            <input
              type="text"
              value={formData.dissertationTitle}
              onChange={(e) =>
                setFormData({ ...formData, dissertationTitle: e.target.value })
              }
              placeholder="Enter your dissertation title or topic"
              className="h-12 rounded-xl border-2 border-neutral-900 bg-white px-4 font-['Satoshi'] text-base font-normal text-neutral-950 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
            />
          </div>

          {/* Data Type */}
          <div className="flex flex-col gap-2">
            <label className="font-['Satoshi'] text-sm font-medium leading-5 text-neutral-950">
              Data Type Needed
            </label>
            <div className="flex gap-4">
              <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-xl border-2 border-neutral-900 bg-white p-4 transition hover:bg-purple-50">
                <input
                  type="radio"
                  name="dataType"
                  value="primary"
                  checked={formData.dataType === "primary"}
                  onChange={(e) =>
                    setFormData({ ...formData, dataType: e.target.value as "primary" })
                  }
                  className="h-4 w-4 text-violet-500 focus:ring-violet-500"
                  required
                />
                <span className="font-['Satoshi'] text-sm font-normal text-neutral-950">
                  Primary Data (Surveys, Interviews)
                </span>
              </label>
              <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-xl border-2 border-neutral-900 bg-white p-4 transition hover:bg-purple-50">
                <input
                  type="radio"
                  name="dataType"
                  value="secondary"
                  checked={formData.dataType === "secondary"}
                  onChange={(e) =>
                    setFormData({ ...formData, dataType: e.target.value as "secondary" })
                  }
                  className="h-4 w-4 text-violet-500 focus:ring-violet-500"
                  required
                />
                <span className="font-['Satoshi'] text-sm font-normal text-neutral-950">
                  Secondary Data (Literature, Reports)
                </span>
              </label>
            </div>
          </div>

          {/* Current Stage */}
          <div className="flex flex-col gap-2">
            <label className="font-['Satoshi'] text-sm font-medium leading-5 text-neutral-950">
              Current Stage
            </label>
            <select
              value={formData.currentStage}
              onChange={(e) => setFormData({ ...formData, currentStage: e.target.value })}
              className="h-12 rounded-xl border-2 border-neutral-900 bg-white px-4 font-['Satoshi'] text-base font-normal text-neutral-950 focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
            >
              {CURRENT_STAGES.map((stage) => (
                <option key={stage} value={stage === "Select your stage" ? "" : stage}>
                  {stage}
                </option>
              ))}
            </select>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label className="font-['Satoshi'] text-sm font-medium leading-5 text-neutral-950">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your.email@example.com"
              className="h-12 rounded-xl border-2 border-neutral-900 bg-white px-4 font-['Satoshi'] text-base font-normal text-neutral-950 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
            />
          </div>

          {/* Phone Number */}
          <div className="flex flex-col gap-2">
            <label className="font-['Satoshi'] text-sm font-medium leading-5 text-neutral-950">
              Phone Number
            </label>
            <PhoneInput
              value={formData.phoneNumber}
              onChange={(value) => setFormData({ ...formData, phoneNumber: value })}
              onCountryChange={(dialCode) => setFormData({ ...formData, countryCode: dialCode })}
              className="h-12 rounded-xl border-2 border-neutral-900 bg-white px-4 font-['Satoshi'] text-base font-normal text-neutral-950 focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="1234567890"
            />
          </div>

          {/* Additional Notes */}
          <div className="flex flex-col gap-2">
            <label className="font-['Satoshi'] text-sm font-medium leading-5 text-neutral-950">
              Additional Notes <span className="text-gray-500">(Optional)</span>
            </label>
            <textarea
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              placeholder="Any additional information you'd like to share..."
              rows={4}
              className="resize-none rounded-xl border-2 border-neutral-900 bg-white px-4 py-3 font-['Satoshi'] text-base font-normal leading-6 text-neutral-950 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>
      </div>

      {/* Payment Section */}
      <div className="rounded-2xl bg-white p-6 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] outline outline-2 outline-offset-[-2px] outline-black md:p-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-['Satoshi'] text-sm font-medium leading-5 text-neutral-950">
              Service Fee
            </span>
            <div className="flex items-center gap-2">
              <span className="font-['Satoshi'] text-lg font-medium leading-6 text-gray-500 line-through">
                ₹5,000
              </span>
              <span className="font-['Clash_Display'] text-2xl font-medium leading-7 text-neutral-950">
                ₹3,500
              </span>
              <span className="rounded bg-emerald-100 px-2 py-1 font-['Satoshi'] text-xs font-medium leading-4 text-emerald-700">
                30% OFF
              </span>
            </div>
          </div>
          <div className="rounded-lg bg-amber-50 p-3">
            <p className="font-['Satoshi'] text-xs font-medium leading-4 text-amber-900">
              High Demand - Price increases soon
            </p>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || paymentProcessing}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 font-['Clash_Display'] text-lg font-medium leading-6 text-white shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] outline outline-2 outline-offset-[-2px] outline-neutral-900 transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0"
          >
            {paymentProcessing ? (
              <>
                <svg
                  className="h-5 w-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing Payment...
              </>
            ) : (
              "Get Dissertations Done"
            )}
          </button>
          <p className="text-center font-['Satoshi'] text-xs font-normal leading-4 text-gray-600">
            Secure Payment • Money-back Guarantee
          </p>
        </div>
      </div>
    </form>
  );
}

