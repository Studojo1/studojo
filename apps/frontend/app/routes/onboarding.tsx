import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { redirect, useNavigate } from "react-router";
import { Header } from "~/components";
import { PhoneInput } from "~/components/phone-input";
import { authClient } from "~/lib/auth-client";
import { getSessionFromRequest, requireOnboardingComplete } from "~/lib/onboarding.server";
import type { Route } from "./+types/onboarding";

const floatY = [0, -24, -12, -30, 0];
const floatX = [0, 12, -18, 8, 0];
const floatRotate = [0, 6, -8, 4, 0];

const BACKGROUND_SHAPES = [
  { className: "right-0 top-20 h-32 w-32 rounded-full md:h-40 md:w-40 bg-yellow-500", shadow: "6px_6px" as const, duration: 18, delay: 0 },
  { className: "left-0 top-1/3 h-24 w-24 md:h-32 md:w-32 bg-emerald-300", shadow: "4px_4px" as const, rotate: 12, duration: 22, delay: 1 },
  { className: "bottom-20 right-1/4 h-20 w-20 md:h-24 md:w-24 bg-violet-500", shadow: "4px_4px" as const, duration: 20, delay: 2 },
  { className: "bottom-1/4 left-0 h-16 w-16 md:h-28 md:w-28 bg-pink-300", shadow: "4px_4px" as const, rotate: 45, duration: 24, delay: 0.5 },
  { className: "top-1/2 right-1/3 h-14 w-14 md:h-20 md:w-20 bg-amber-400", shadow: "3px_3px" as const, rotate: -12, duration: 19, delay: 1.5 },
  { className: "top-12 left-1/4 h-16 w-16 md:h-20 md:w-20 rounded-full bg-teal-300", shadow: "4px_4px" as const, duration: 21, delay: 0.8 },
  { className: "bottom-1/3 right-0 h-20 w-20 md:h-24 md:w-24 bg-rose-300", shadow: "4px_4px" as const, rotate: -20, duration: 23, delay: 1.2 },
  { className: "top-1/4 right-1/5 h-12 w-12 md:h-16 md:w-16 rounded-2xl bg-indigo-300", shadow: "3px_3px" as const, rotate: 15, duration: 17, delay: 2.5 },
  { className: "bottom-32 left-1/3 h-14 w-14 md:h-18 md:w-18 rounded-full bg-lime-300", shadow: "3px_3px" as const, duration: 25, delay: 0.3 },
  { className: "top-2/3 left-1/5 h-20 w-20 md:h-28 md:w-28 bg-orange-200", shadow: "4px_4px" as const, rotate: -15, duration: 20, delay: 1.8 },
  { className: "top-16 right-1/4 h-10 w-10 md:h-14 md:w-14 rounded-2xl bg-cyan-300", shadow: "3px_3px" as const, rotate: 25, duration: 26, delay: 0.6 },
  { className: "bottom-12 left-1/2 h-12 w-12 md:h-16 md:w-16 bg-fuchsia-200", shadow: "3px_3px" as const, rotate: -8, duration: 22, delay: 2.2 },
];

function FloatShape({
  className,
  shadow,
  rotate = 0,
  duration,
  delay,
}: {
  className: string;
  shadow: "6px_6px" | "4px_4px" | "3px_3px";
  rotate?: number;
  duration: number;
  delay: number;
}) {
  const shadowClass =
    shadow === "6px_6px"
      ? "shadow-[6px_6px_0px_0px_rgba(25,26,35,1)]"
      : shadow === "4px_4px"
        ? "shadow-[4px_4px_0px_0px_rgba(25,26,35,1)]"
        : "shadow-[3px_3px_0px_0px_rgba(25,26,35,1)]";

  return (
    <motion.div
      className={`absolute rounded-2xl border-2 border-neutral-900 opacity-40 md:opacity-50 ${shadowClass} ${className}`}
      aria-hidden
      animate={{
        y: floatY,
        x: floatX,
        rotate: rotate ? floatRotate.map((r) => rotate + r) : floatRotate,
      }}
      transition={{
        repeat: Infinity,
        repeatType: "reverse",
        duration,
        delay,
      }}
    />
  );
}

const STEPS = [
  { id: 0, label: "Phone", key: "phone" as const },
  { id: 1, label: "Full Name", key: "fullName" as const },
  { id: 2, label: "College / University Name", key: "college" as const },
  { id: 3, label: "Year of Study", key: "yearOfStudy" as const },
  { id: 4, label: "Course / Major", key: "course" as const },
] as const;

const PROFILE_KEYS = ["fullName", "college", "yearOfStudy", "course"] as const;
type ProfileKey = (typeof PROFILE_KEYS)[number];

const YEAR_OPTIONS = [
  "First year",
  "Second year",
  "Third year",
  "Fourth year",
  "Final year",
  "Postgraduate",
  "Other",
];

const INPUT_CLASS =
  "w-full rounded-xl border-2 border-neutral-900 bg-white px-4 py-3 font-['Satoshi'] text-base font-normal leading-6 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2";
const LABEL_CLASS = "mb-2 block font-['Satoshi'] text-sm font-medium leading-5 text-neutral-900";
const BTN_PRIMARY =
  "rounded-2xl border-2 border-neutral-900 bg-purple-500 px-6 py-3 font-['Satoshi'] text-base font-medium leading-6 text-white shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-60 disabled:pointer-events-none";
const BTN_SECONDARY =
  "rounded-2xl border-2 border-neutral-900 bg-white px-6 py-3 font-['Satoshi'] text-base font-medium leading-6 text-neutral-900 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-60 disabled:pointer-events-none";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSessionFromRequest(request);
  if (!session) throw redirect("/auth");
  
  // Check if onboarding is complete (both phone and profile)
  const onboardingStatus = await requireOnboardingComplete(session.user.id);
  if (onboardingStatus.complete) {
    throw redirect("/");
  }
  
  return { steps: STEPS };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Complete your profile – Studojo" },
    { name: "description", content: "A few details to get you started." },
  ];
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Record<ProfileKey, string>>({
    fullName: "",
    college: "",
    yearOfStudy: "",
    course: "",
  });
  const [otherYearText, setOtherYearText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91"); // Default to India
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const isPhoneStep = step === 0;
  const canNext = isPhoneStep
    ? otpSent && !!otpCode.trim()
    : current.key === "yearOfStudy"
      ? !!form.yearOfStudy
      : !!form[current.key as ProfileKey]?.trim();

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  // Cooldown timer for request new code
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds(s => s - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const handleSendOtp = async () => {
    const number = phone.trim();
    if (!number) return;
    setError(null);
    setSendingOtp(true);
    const fullNumber = countryCode + number;
    const { error: err } = await authClient.phoneNumber.sendOtp({
      phoneNumber: fullNumber,
    });
    setSendingOtp(false);
    if (err) {
      setError(err.message ?? "Failed to send code.");
      return;
    }
    setOtpSent(true);
    setOtpCode("");
    setCooldownSeconds(60); // Start 60 second cooldown
  };

  const handleVerify = async () => {
    const number = phone.trim();
    const code = otpCode.trim();
    if (!number || !code) return;
    setError(null);
    setVerifying(true);
    const fullNumber = countryCode + number;
    const { error: err } = await authClient.phoneNumber.verify({
      phoneNumber: fullNumber,
      code,
      updatePhoneNumber: true,
    });
    setVerifying(false);
    if (err) {
      const status = (err as { status?: number }).status;
      const msg =
        status === 403
          ? "Too many attempts. Request a new code."
          : err.message ?? "Verification failed.";
      setError(msg);
      return;
    }
    setPhone("");
    setOtpSent(false);
    setOtpCode("");
    setStep(1);
    void authClient.getSession();
  };

  const handleRequestNewCode = async () => {
    if (cooldownSeconds > 0) return; // Prevent during cooldown
    setError(null);
    setOtpCode("");
    await handleSendOtp();
  };

  const goNext = async () => {
    setError(null);
    if (isPhoneStep) {
      await handleVerify();
      return;
    }
    if (isLast) {
      setSubmitting(true);
      const payload = { ...form };
      if (form.yearOfStudy === "Other" && otherYearText.trim()) {
        payload.yearOfStudy = otherYearText.trim();
      }
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        // If profile already exists (409), just redirect to home
        if (res.status === 409) {
          navigate("/", { replace: true });
          return;
        }
        setError(data.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }
      navigate("/", { replace: true });
      return;
    }
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setError(null);
    if (step === 1) {
      setPhone("");
      setOtpSent(false);
      setOtpCode("");
    }
    setStep((s) => Math.max(0, s - 1));
  };

  return (
    <>
      <Header />
      <main className="relative min-h-screen overflow-hidden bg-purple-50">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          {BACKGROUND_SHAPES.map((shape, i) => (
            <FloatShape key={i} {...shape} />
          ))}
        </div>

        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-[var(--section-max-width)] items-center justify-center px-4 py-12 md:px-8 md:py-20">
          <motion.div
            className="relative z-10 w-full max-w-md"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="mb-6 text-center">
              <h2 className="font-['Satoshi'] text-2xl font-black leading-9 text-neutral-900 md:text-3xl md:leading-9">
                studojo
              </h2>
            </div>

            <div className="relative rounded-2xl border-2 border-neutral-900 bg-white p-6 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] md:p-8">
              <div className="mb-6">
                <span className="font-['Satoshi'] text-sm font-medium leading-5 text-neutral-500">
                  Step {step + 1} of {STEPS.length}
                </span>
                <div
                  className="mt-2 flex gap-1"
                  role="progressbar"
                  aria-valuenow={step + 1}
                  aria-valuemin={1}
                  aria-valuemax={STEPS.length}
                  aria-label="Progress"
                >
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      aria-current={i === step ? "step" : undefined}
                      className={`h-1.5 flex-1 rounded-full ${
                        i <= step ? "bg-neutral-900" : "bg-neutral-200"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (canNext) void goNext();
                }}
                className="space-y-6"
              >
                {error && (
                  <div
                    className="rounded-xl border-2 border-red-500 bg-red-50 px-4 py-3 font-['Satoshi'] text-sm font-medium leading-5 text-red-700"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <h1 className="mb-2 font-['Clash_Display'] text-xl font-medium tracking-tight text-neutral-900 md:text-2xl">
                      {current.label}
                    </h1>
                    <p className="mb-4 font-['Satoshi'] text-sm font-normal leading-5 text-neutral-600 md:text-base">
                      {step === 0 && "We'll send a verification code to this number."}
                      {step === 1 && "What should we call you?"}
                      {step === 2 && "Where do you study?"}
                      {step === 3 && "Which year are you in?"}
                      {step === 4 && "What are you studying?"}
                    </p>

                    {isPhoneStep ? (
                      <div className="space-y-4">
                        {!otpSent ? (
                          <>
                            <label htmlFor="phone" className={LABEL_CLASS}>
                              Phone
                            </label>
                            <PhoneInput
                              value={phone}
                              onChange={setPhone}
                              onCountryChange={setCountryCode}
                              defaultCountry={countryCode}
                              inputRef={inputRef as React.RefObject<HTMLInputElement>}
                              className={INPUT_CLASS}
                              placeholder="1234567890"
                            />
                          </>
                        ) : (
                          <>
                            <p className="font-['Satoshi'] text-sm text-neutral-600">
                              Code sent to {countryCode} {phone}
                            </p>
                            <label htmlFor="otp" className={LABEL_CLASS}>
                              Verification code
                            </label>
                            <input
                              ref={inputRef as React.RefObject<HTMLInputElement>}
                              type="text"
                              id="otp"
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                              placeholder="123456"
                              className={INPUT_CLASS}
                            />
                          </>
                        )}
                      </div>
                    ) : current.key === "yearOfStudy" ? (
                      <div>
                        <label htmlFor="yearOfStudy" className={LABEL_CLASS}>
                          Year of Study
                        </label>
                        <select
                          ref={inputRef as React.RefObject<HTMLSelectElement>}
                          id="yearOfStudy"
                          value={form.yearOfStudy}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, yearOfStudy: e.target.value }))
                          }
                          className={INPUT_CLASS}
                          required
                        >
                          <option value="">Select…</option>
                          {YEAR_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        {form.yearOfStudy === "Other" && (
                          <input
                            type="text"
                            placeholder="Specify (optional)"
                            className={`mt-3 ${INPUT_CLASS}`}
                            value={otherYearText}
                            onChange={(e) => setOtherYearText(e.target.value)}
                          />
                        )}
                      </div>
                    ) : (
                      <div>
                        <label htmlFor={current.key} className={LABEL_CLASS}>
                          {current.label}
                        </label>
                        <input
                          ref={inputRef as React.RefObject<HTMLInputElement>}
                          type="text"
                          id={current.key}
                          value={form[current.key as ProfileKey]}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, [current.key as ProfileKey]: e.target.value }))
                          }
                          placeholder={
                            current.key === "fullName"
                              ? "e.g. Jane Doe"
                              : current.key === "college"
                                ? "e.g. MIT"
                                : "e.g. Computer Science"
                          }
                          className={INPUT_CLASS}
                          required
                          autoComplete={
                            current.key === "fullName" ? "name" : "organization"
                          }
                        />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="flex gap-3 pt-2">
                  {!isFirst && (
                    <button
                      type="button"
                      onClick={goBack}
                      disabled={submitting || verifying}
                      className={BTN_SECONDARY}
                    >
                      Back
                    </button>
                  )}
                  {isPhoneStep && !otpSent ? (
                    <button
                      type="button"
                      onClick={() => void handleSendOtp()}
                      disabled={!phone.trim() || sendingOtp}
                      className={`${BTN_PRIMARY} w-full`}
                    >
                      {sendingOtp ? "Sending…" : "Send code"}
                    </button>
                  ) : isPhoneStep && otpSent ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void handleRequestNewCode()}
                        disabled={verifying || sendingOtp || cooldownSeconds > 0}
                        className={BTN_SECONDARY}
                      >
                        {sendingOtp 
                          ? "Sending…" 
                          : cooldownSeconds > 0 
                            ? `Request new code (${cooldownSeconds}s)`
                            : "Request new code"}
                      </button>
                      <button
                        type="submit"
                        disabled={!canNext || verifying}
                        className={`${BTN_PRIMARY} flex-1`}
                      >
                        {verifying ? "Verifying…" : "Verify"}
                      </button>
                    </>
                  ) : (
                    <button
                      type="submit"
                      disabled={!canNext || submitting}
                      className={`${BTN_PRIMARY} ${!isFirst ? "flex-1" : "w-full"}`}
                    >
                      {submitting
                        ? "Saving…"
                        : isLast
                          ? "Complete"
                          : "Continue"}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </main>
    </>
  );
}
