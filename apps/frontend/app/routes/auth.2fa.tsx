import { useState } from "react";
import { useNavigate } from "react-router";
import { Header } from "~/components";
import { authClient } from "~/lib/auth-client";
import type { Route } from "./+types/auth.2fa";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Two-Factor Verification – Studojo" },
    {
      name: "description",
      content: "Enter your verification code to complete sign in.",
    },
  ];
}

export default function Auth2FA() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: err } = await authClient.twoFactor.verifyTotp({
      code: code.trim(),
      trustDevice,
    });

    if (err) {
      setError(err.message ?? "Invalid code. Please try again.");
      setSubmitting(false);
      return;
    }

    navigate("/", { replace: true });
    setSubmitting(false);
  };

  return (
    <>
      <Header />
      <main className="relative min-h-screen overflow-hidden bg-purple-50">
        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-[var(--section-max-width)] items-center justify-center px-4 py-12 md:px-8 md:py-20">
          <div className="relative w-full max-w-md rounded-2xl border-2 border-neutral-900 bg-white p-8 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)]">
            <h1 className="mb-2 font-['Clash_Display'] text-2xl font-medium tracking-tight text-neutral-900">
              Two-factor verification
            </h1>
            <p className="mb-6 font-['Satoshi'] text-base font-normal leading-6 text-neutral-600">
              Enter the code from your authenticator app.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  className="rounded-xl border-2 border-red-500 bg-red-50 px-4 py-3 font-['Satoshi'] text-sm font-medium leading-5 text-red-700"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="code"
                  className="mb-2 block font-['Satoshi'] text-sm font-medium leading-5 text-neutral-900"
                >
                  Verification code
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  className="w-full rounded-xl border-2 border-neutral-900 bg-white px-4 py-3 font-['Satoshi'] text-base font-mono tracking-widest text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  className="h-4 w-4 rounded border-2 border-neutral-900 text-purple-500 focus:ring-2 focus:ring-purple-500"
                />
                <span className="font-['Satoshi'] text-sm font-normal leading-5 text-neutral-700">
                  Trust this device for 30 days
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting || code.length < 6}
                className="w-full rounded-2xl border-2 border-neutral-900 bg-purple-500 px-6 py-4 font-['Satoshi'] text-base font-medium leading-6 text-white shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-60 disabled:pointer-events-none"
              >
                {submitting ? "Verifying…" : "Verify"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
