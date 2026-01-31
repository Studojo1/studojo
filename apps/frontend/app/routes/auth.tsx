import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Header } from "~/components";
import { authClient } from "~/lib/auth-client";
import { identifyUser, trackEvent } from "~/lib/mixpanel";
import type { Route } from "./+types/auth";

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

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign In – Studojo" },
    {
      name: "description",
      content: "Sign in or create your Studojo account to get started.",
    },
  ];
}

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: session, isPending } = authClient.useSession();
  const lastMethod = authClient.getLastUsedLoginMethod();
  const isLastGoogle = authClient.isLastUsedLoginMethod("google");
  const isLastEmail = authClient.isLastUsedLoginMethod("email");
  const passkeyAttemptedRef = useRef(false);

  useEffect(() => {
    if (!isPending && session) navigate("/", { replace: true });
  }, [isPending, session, navigate]);

  useEffect(() => {
    // Only attempt passkey autoFill once per mount, and only in signin mode
    if (mode !== "signin" || passkeyAttemptedRef.current) return;
    
    // Only run in browser
    if (typeof window === "undefined") return;
    
    const ok = typeof PublicKeyCredential !== "undefined" &&
      typeof PublicKeyCredential.isConditionalMediationAvailable === "function";
    if (!ok) return;
    
    passkeyAttemptedRef.current = true;
    
    void PublicKeyCredential.isConditionalMediationAvailable().then((avail) => {
      if (avail) {
        void authClient.signIn.passkey({ autoFill: true }).then((result) => {
          if (result.error) {
            // Only show error if it's not a user cancellation or webauthn input error
            const errorCode = (result.error as any).code;
            const errorMessage = result.error.message?.toLowerCase() ?? "";
            const isCancelled = errorCode === "AUTH_CANCELLED" || 
                               errorMessage.includes("auth cancelled") || 
                               errorMessage.includes("registration cancelled") ||
                               errorMessage.includes("webauthn") ||
                               errorMessage.includes("autocomplete");
            if (!isCancelled) {
              setError(result.error.message ?? "Passkey authentication failed");
            }
          }
        }).catch(() => {
          // Silently catch errors to prevent infinite loops
        });
      }
    });
  }, [mode]);

  if (!isPending && session) return null;

  const handleModeToggle = (newMode: "signin" | "signup") => {
    setMode(newMode);
    setError(null);
    setSearchParams({ mode: newMode });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string | null;
    const remember = (form.querySelector<HTMLInputElement>("input[name=remember]")?.checked) ?? true;

    if (mode === "signup") {
      if (password !== confirmPassword) {
        setError("Passwords don't match");
        setSubmitting(false);
        return;
      }
      const { error: err, data } = await authClient.signUp.email(
        {
          email,
          password,
          name: email.split("@")[0] || "User",
          callbackURL: "/",
        },
        { onSuccess: () => navigate("/") },
      );
      if (err) {
        const code = (err as { code?: string }).code;
        const msg =
          code === "PASSWORD_COMPROMISED"
            ? "This password has been found in a data breach. Please choose a different password."
            : err.message ?? "Sign up failed";
        setError(msg);
        // Track failed sign up
        trackEvent("Sign Up", {
          user_id: undefined,
          email: email,
          signup_method: "email",
          success: false,
        });
      } else if (data?.user) {
        // Track successful sign up
        const urlParams = new URLSearchParams(window.location.search);
        trackEvent("Sign Up", {
          user_id: data.user.id,
          email: data.user.email,
          signup_method: "email",
          utm_source: urlParams.get("utm_source") || undefined,
          utm_medium: urlParams.get("utm_medium") || undefined,
          utm_campaign: urlParams.get("utm_campaign") || undefined,
        });
        // Identify user
        identifyUser(data.user.id, {
          email: data.user.email,
          name: data.user.name,
        });
      }
    } else {
      const { error: err, data } = await authClient.signIn.email(
        {
          email,
          password,
          callbackURL: "/",
          rememberMe: remember,
        },
        { onSuccess: () => navigate("/") },
      );
      if (err) {
        setError(err.message ?? "Sign in failed");
        // Track failed sign in
        trackEvent("Sign In", {
          user_id: undefined,
          login_method: "email",
          success: false,
        });
      } else if (data?.user) {
        // Track successful sign in
        trackEvent("Sign In", {
          user_id: data.user.id,
          login_method: "email",
          success: true,
        });
        // Identify user
        identifyUser(data.user.id, {
          email: data.user.email,
          name: data.user.name,
        });
      }
    }

    setSubmitting(false);
  };

  const handleGoogleSignIn = () => {
    setError(null);
    // Track Google sign in attempt
    trackEvent("Sign In", {
      login_method: "google",
      success: undefined, // Will be updated on success/failure
    });
    authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
  };

  const handlePasskeySignIn = async () => {
    setError(null);
    setSubmitting(true);
    
    try {
      const result = await authClient.signIn.passkey({});
      
      if (result.error) {
        // Only show error if it's not a user cancellation
        const errorCode = (result.error as any).code;
        const errorMessage = result.error.message?.toLowerCase() ?? "";
        if (errorCode !== "AUTH_CANCELLED" && errorMessage !== "auth cancelled" && errorMessage !== "registration cancelled") {
          setError(result.error.message ?? "Passkey authentication failed. Please try again.");
        }
        setSubmitting(false);
      } else if (result.data) {
        // Track successful passkey sign in
        if (result.data.user) {
          trackEvent("Sign In", {
            user_id: result.data.user.id,
            login_method: "passkey",
            success: true,
          });
          // Identify user
          identifyUser(result.data.user.id, {
            email: result.data.user.email,
            name: result.data.user.name,
          });
        }
        // Success - navigate will happen via onSuccess callback if provided
        navigate("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Passkey authentication failed. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="relative min-h-screen overflow-hidden bg-purple-50">
        {/* Background decorative shapes - Framer Motion, slow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          {BACKGROUND_SHAPES.map((shape, i) => (
            <FloatShape key={i} {...shape} />
          ))}
        </div>

        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-[var(--section-max-width)] items-center justify-center px-4 py-12 md:px-8 md:py-20">
          <motion.div
            className="relative w-full max-w-md z-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Studojo Logo */}
            <div className="mb-8 text-center">
              <h2 className="font-['Satoshi'] text-3xl font-black leading-9 text-neutral-900 md:text-4xl md:leading-7">
                studojo
              </h2>
            </div>

            {/* Toggle Tabs */}
            <div className="mb-8 flex gap-2 rounded-2xl border-2 border-neutral-900 bg-white p-1 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)]">
              <button
                type="button"
                onClick={() => handleModeToggle("signin")}
                className={`flex-1 rounded-xl px-4 py-3 font-['Satoshi'] text-base font-medium leading-6 transition-colors ${
                  mode === "signin"
                    ? "bg-neutral-900 text-white"
                    : "bg-transparent text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleModeToggle("signup")}
                className={`flex-1 rounded-xl px-4 py-3 font-['Satoshi'] text-base font-medium leading-6 transition-colors ${
                  mode === "signup"
                    ? "bg-neutral-900 text-white"
                    : "bg-transparent text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Form Card */}
            <div className="relative rounded-2xl border-2 border-neutral-900 bg-white p-8 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <h1 className="mb-6 font-['Clash_Display'] text-3xl font-medium leading-tight tracking-tight text-neutral-900">
                    {mode === "signin" ? "Welcome back" : "Create your account"}
                  </h1>
                  <p className="mb-8 font-['Satoshi'] text-base font-normal leading-6 text-neutral-700">
                    {mode === "signin"
                      ? "Sign in to continue to your account"
                      : "Get started with Studojo today"}
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div
                    className="rounded-xl border-2 border-red-500 bg-red-50 px-4 py-3 font-['Satoshi'] text-sm font-medium leading-5 text-red-700"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  {lastMethod && (
                    <p className="font-['Satoshi'] text-sm font-medium leading-5 text-neutral-500">
                      Last signed in with {isLastGoogle ? "Google" : isLastEmail ? "email" : lastMethod}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={submitting}
                    className={`flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-neutral-900 px-6 py-3 font-['Satoshi'] text-base font-medium leading-6 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-60 disabled:pointer-events-none ${
                      isLastGoogle ? "bg-neutral-900 text-white" : "bg-white text-neutral-900"
                    }`}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign in with Google
                  </button>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={handlePasskeySignIn}
                      disabled={submitting}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-neutral-900 bg-white px-6 py-3 font-['Satoshi'] text-base font-medium leading-6 text-neutral-900 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-60 disabled:pointer-events-none"
                    >
                      {submitting ? "Signing in…" : "Sign in with Passkey"}
                    </button>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden>
                    <div className="w-full border-t border-neutral-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 font-['Satoshi'] text-sm font-medium leading-5 text-neutral-500">
                      or
                    </span>
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="mb-2 block font-['Satoshi'] text-sm font-medium leading-5 text-neutral-900">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    autoComplete={mode === "signin" ? "email webauthn" : "email"}
                    className="w-full rounded-xl border-2 border-neutral-900 bg-white px-4 py-3 font-['Satoshi'] text-base font-normal leading-6 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block font-['Satoshi'] text-sm font-medium leading-5 text-neutral-900">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    autoComplete={mode === "signin" ? "current-password webauthn" : "new-password"}
                    className="w-full rounded-xl border-2 border-neutral-900 bg-white px-4 py-3 font-['Satoshi'] text-base font-normal leading-6 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    placeholder="••••••••"
                  />
                </div>

                {mode === "signup" && (
                  <div>
                    <label htmlFor="confirmPassword" className="mb-2 block font-['Satoshi'] text-sm font-medium leading-5 text-neutral-900">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      required
                      autoComplete="new-password"
                      className="w-full rounded-xl border-2 border-neutral-900 bg-white px-4 py-3 font-['Satoshi'] text-base font-normal leading-6 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                      placeholder="••••••••"
                    />
                  </div>
                )}

                {mode === "signin" && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input type="checkbox" name="remember" className="h-4 w-4 rounded border-2 border-neutral-900 text-purple-500 focus:ring-2 focus:ring-purple-500" />
                      <span className="ml-2 font-['Satoshi'] text-sm font-normal leading-5 text-neutral-700">Remember me</span>
                    </label>
                    <a href="#" className="font-['Satoshi'] text-sm font-medium leading-5 text-purple-500 hover:text-purple-600">
                      Forgot password?
                    </a>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-2xl border-2 border-neutral-900 bg-purple-500 px-6 py-4 font-['Satoshi'] text-base font-medium leading-6 text-white shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-60 disabled:pointer-events-none"
                >
                  {submitting ? "Please wait…" : mode === "signin" ? "Sign In" : "Sign Up"}
                </button>
              </form>

              {mode === "signin" && (
                <p className="mt-6 text-center font-['Satoshi'] text-sm font-normal leading-5 text-neutral-700">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => handleModeToggle("signup")}
                    className="font-medium text-purple-500 hover:text-purple-600"
                  >
                    Sign up
                  </button>
                </p>
              )}

              {mode === "signup" && (
                <p className="mt-6 text-center font-['Satoshi'] text-sm font-normal leading-5 text-neutral-700">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => handleModeToggle("signin")}
                    className="font-medium text-purple-500 hover:text-purple-600"
                  >
                    Sign in
                  </button>
                </p>
              )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </main>
    </>
  );
}
