import { useState } from "react";
import { toast } from "sonner";
import { PhoneInput } from "~/components/phone-input";
import { createPaymentOrder, openRazorpayCheckout, verifyPayment } from "~/lib/payments";
import { trackEvent } from "~/lib/mixpanel";
import { authClient } from "~/lib/auth-client";

interface CareersApplyFormData {
  name: string;
  phoneNumber: string;
  countryCode: string;
  city: string;
  institutionName: string;
  currentYear: string;
  course: string;
  email: string;
  areasOfInterest: string[];
}

const CURRENT_YEARS = [
  "Select Year",
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "Post Graduate",
  "Graduated",
] as const;

const AREAS_OF_INTEREST = [
  "Marketing",
  "Sales & Lead Generation",
  "Finance & Accounting",
  "UI/UX Design",
  "Human Resources & Recruitment",
  "Social Media Management",
  "Operations & Process Management",
] as const;

export function CareersApplyForm() {
  const [formData, setFormData] = useState<CareersApplyFormData>({
    name: "",
    phoneNumber: "",
    countryCode: "+91",
    city: "",
    institutionName: "",
    currentYear: "",
    course: "",
    email: "",
    areasOfInterest: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      areasOfInterest: prev.areasOfInterest.includes(interest)
        ? prev.areasOfInterest.filter((i) => i !== interest)
        : [...prev.areasOfInterest, interest],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!formData.phoneNumber.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    if (!formData.city.trim()) {
      toast.error("Please enter your city");
      return;
    }
    if (!formData.institutionName.trim()) {
      toast.error("Please enter your institution name");
      return;
    }
    if (!formData.currentYear || formData.currentYear === "Select Year") {
      toast.error("Please select your current year");
      return;
    }
    if (!formData.course.trim()) {
      toast.error("Please enter your course");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (formData.areasOfInterest.length === 0) {
      toast.error("Please select at least one area of interest");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create payment order
      const amount = 99900; // ₹999 in paise
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
        description: "Career Application Registration",
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
              const apiResponse = await fetch("/api/careers/apply", {
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

              toast.success("Payment successful! Your application has been received.");
              // Reset form
              setFormData({
                name: "",
                phoneNumber: "",
                countryCode: "+91",
                city: "",
                institutionName: "",
                currentYear: "",
                course: "",
                email: "",
                areasOfInterest: [],
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
          {/* Name */}
          <div className="flex flex-col gap-2">
            <label className="font-['Satoshi'] text-sm font-medium leading-5 text-neutral-950">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your full name"
              className="h-12 rounded-xl border-2 border-neutral-900 bg-white px-4 font-['Satoshi'] text-base font-normal text-neutral-950 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Mobile Number */}
          <div className="flex flex-col gap-2">
            <label className="font-['Satoshi'] text-sm font-medium leading-5 text-neutral-950">
              Mobile Number
            </label>
            <PhoneInput
              value={formData.phoneNumber}
              onChange={(value) => setFormData({ ...formData, phoneNumber: value })}
              onCountryChange={(dialCode) => setFormData({ ...formData, countryCode: dialCode })}
              className="h-12 rounded-xl border-2 border-neutral-900 bg-white px-4 font-['Satoshi'] text-base font-normal text-neutral-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="1234567890"
            />
          </div>

          {/* City */}
          <div className="flex flex-col gap-2">
            <label className="font-['Satoshi'] text-sm font-medium leading-5 text-neutral-950">
              City
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Enter your city"
              className="h-12 rounded-xl border-2 border-neutral-900 bg-white px-4 font-['Satoshi'] text-base font-normal text-neutral-950 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Institution Name */}
          <div className="flex flex-col gap-2">
            <label className="font-['Satoshi'] text-sm font-medium leading-5 text-neutral-950">
              Institution Name
            </label>
            <input
              type="text"
              value={formData.institutionName}
              onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
              placeholder="Enter your college/university name"
              className="h-12 rounded-xl border-2 border-neutral-900 bg-white px-4 font-['Satoshi'] text-base font-normal text-neutral-950 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Current Year */}
          <div className="flex flex-col gap-2">
            <label className="font-['Satoshi'] text-sm font-medium leading-5 text-neutral-950">
              Current Year
            </label>
            <select
              value={formData.currentYear}
              onChange={(e) => setFormData({ ...formData, currentYear: e.target.value })}
              className="h-12 rounded-xl border-2 border-neutral-900 bg-white px-4 font-['Satoshi'] text-base font-normal text-neutral-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              {CURRENT_YEARS.map((year) => (
                <option key={year} value={year === "Select Year" ? "" : year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Course */}
          <div className="flex flex-col gap-2">
            <label className="font-['Satoshi'] text-sm font-medium leading-5 text-neutral-950">
              Course
            </label>
            <input
              type="text"
              value={formData.course}
              onChange={(e) => setFormData({ ...formData, course: e.target.value })}
              placeholder="Enter your course/degree"
              className="h-12 rounded-xl border-2 border-neutral-900 bg-white px-4 font-['Satoshi'] text-base font-normal text-neutral-950 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Email Address */}
          <div className="flex flex-col gap-2">
            <label className="font-['Satoshi'] text-sm font-medium leading-5 text-neutral-950">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your.email@example.com"
              className="h-12 rounded-xl border-2 border-neutral-900 bg-white px-4 font-['Satoshi'] text-base font-normal text-neutral-950 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Areas of Interest */}
          <div className="flex flex-col gap-2">
            <label className="font-['Satoshi'] text-sm font-medium leading-5 text-neutral-950">
              Areas of Interest
            </label>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {AREAS_OF_INTEREST.map((interest) => (
                <label
                  key={interest}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-neutral-900 bg-white p-4 transition hover:bg-emerald-50"
                >
                  <input
                    type="checkbox"
                    checked={formData.areasOfInterest.includes(interest)}
                    onChange={() => toggleInterest(interest)}
                    className="h-4 w-4 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="font-['Satoshi'] text-sm font-normal text-neutral-950">
                    {interest}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Section */}
      <div className="rounded-2xl bg-white p-6 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] outline outline-2 outline-offset-[-2px] outline-black md:p-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-['Satoshi'] text-sm font-medium leading-5 text-neutral-950">
              Registration Fee
            </span>
            <span className="font-['Clash_Display'] text-2xl font-medium leading-7 text-neutral-950">
              ₹999
            </span>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || paymentProcessing}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 font-['Clash_Display'] text-lg font-medium leading-6 text-white shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] outline outline-2 outline-offset-[-2px] outline-neutral-900 transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0"
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
              "Pay & Apply Now"
            )}
          </button>
          <p className="text-center font-['Satoshi'] text-xs font-normal leading-4 text-gray-600">
            Secure Payment
          </p>
        </div>
      </div>
    </form>
  );
}

