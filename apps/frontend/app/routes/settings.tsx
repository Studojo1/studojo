import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { redirect, useNavigate } from "react-router";
import { Header } from "~/components";
import { authClient } from "~/lib/auth-client";
import { getSessionFromRequest, requireOnboardingComplete } from "~/lib/onboarding.server";
import type { Route } from "./+types/settings";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSessionFromRequest(request);
  if (!session) throw redirect("/auth");
  
  // Check if onboarding is complete (both phone and profile)
  const onboardingStatus = await requireOnboardingComplete(session.user.id);
  if (!onboardingStatus.complete) {
    throw redirect("/onboarding");
  }
  
  return null;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Settings – Studojo" },
    {
      name: "description",
      content: "Manage your account security settings, passkeys, and two-factor authentication.",
    },
  ];
}

type Passkey = {
  id: string;
  name: string | null;
  createdAt: string | null;
  deviceType: string;
};

type TwoFactorSetup = {
  totpURI: string;
  backupCodes: string[];
};

export default function Settings() {
  const navigate = useNavigate();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loadingPasskeys, setLoadingPasskeys] = useState(true);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [passkeySuccess, setPasskeySuccess] = useState<string | null>(null);
  const [addingPasskey, setAddingPasskey] = useState(false);
  const [passkeyName, setPasskeyName] = useState("");
  const [deletingPasskeyId, setDeletingPasskeyId] = useState<string | null>(null);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [twoFactorSuccess, setTwoFactorSuccess] = useState<string | null>(null);
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null);
  const [twoFactorPassword, setTwoFactorPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [enabling2FA, setEnabling2FA] = useState(false);
  const [disabling2FA, setDisabling2FA] = useState(false);
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [generatingBackupCodes, setGeneratingBackupCodes] = useState(false);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void | Promise<void>;
    destructive?: boolean;
  } | null>(null);
  
  // Check if user signed in with OAuth (no password)
  const lastLoginMethod = authClient.getLastUsedLoginMethod();
  const isOAuthUser = lastLoginMethod === "google" || lastLoginMethod === "oauth";
  const hasPasswordAccount = !isOAuthUser;

  const showConfirmModal = (config: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void | Promise<void>;
    destructive?: boolean;
  }) => {
    setModalConfig(config);
    setModalOpen(true);
  };

  const handleModalConfirm = async () => {
    if (modalConfig) {
      await modalConfig.onConfirm();
      setModalOpen(false);
      setModalConfig(null);
    }
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    setModalConfig(null);
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!sessionPending && !session) {
      navigate("/auth?mode=signin", { replace: true });
    }
  }, [sessionPending, session, navigate]);

  // Load passkeys
  useEffect(() => {
    if (!session) return;
    loadPasskeys();
  }, [session]);

  // Check 2FA status
  useEffect(() => {
    if (session?.user) {
      setTwoFactorEnabled(session.user.twoFactorEnabled ?? false);
    }
  }, [session]);

  const loadPasskeys = async () => {
    if (!session) return;
    setLoadingPasskeys(true);
    setPasskeyError(null);
    try {
      // Use authClient's fetch method for proper authentication
      const response = await authClient.$fetch("/passkey/list-user-passkeys", {
        method: "GET",
      });
      
      // The endpoint returns the array directly
      if (Array.isArray(response)) {
        setPasskeys(response);
      } else if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
        // Fallback in case response is wrapped
        setPasskeys(response.data);
      } else {
        setPasskeys([]);
      }
    } catch (err: any) {
      console.error("Error loading passkeys:", err);
      setPasskeyError(err?.message ?? err?.error?.message ?? "Failed to load passkeys");
      setPasskeys([]);
    } finally {
      setLoadingPasskeys(false);
    }
  };

  const handleAddPasskey = async () => {
    if (!session) return;
    setAddingPasskey(true);
    setPasskeyError(null);
    setPasskeySuccess(null);

    try {
      const result = await authClient.passkey.addPasskey({
        name: passkeyName.trim() || undefined,
      });

      if (result.error) {
        setPasskeyError(result.error.message ?? "Failed to add passkey");
      } else {
        setPasskeySuccess("Passkey added successfully!");
        setPasskeyName("");
        await loadPasskeys();
      }
    } catch (err) {
      setPasskeyError(err instanceof Error ? err.message : "Failed to add passkey");
    } finally {
      setAddingPasskey(false);
    }
  };

  const handleDeletePasskey = (passkeyId: string) => {
    if (!session) return;
    
    showConfirmModal({
      title: "Delete Passkey",
      message: "Are you sure you want to delete this passkey? You won't be able to sign in with it anymore.",
      confirmText: "Delete",
      cancelText: "Cancel",
      destructive: true,
      onConfirm: async () => {
        setDeletingPasskeyId(passkeyId);
        setPasskeyError(null);
        setPasskeySuccess(null);

        try {
          // Use authClient's fetch method to call the delete endpoint
          await authClient.$fetch("/passkey/delete-passkey", {
            method: "POST",
            body: { id: passkeyId },
          });

          // If we get here without an error, deletion succeeded
          // Show success and reload passkeys
          setPasskeySuccess("Passkey deleted successfully!");
          setPasskeyError(null);
          await loadPasskeys();
        } catch (err: any) {
          console.error("Error deleting passkey:", err);
          // Even if there's an error, the deletion might have succeeded
          // Reload passkeys first
          await loadPasskeys();
          
          // Then check if the passkey is still there
          // We need to check the updated state, so use a callback approach
          setTimeout(async () => {
            // Reload again to get fresh state
            const updatedPasskeys = await authClient.$fetch("/passkey/list-user-passkeys", {
              method: "GET",
            });
            
            const passkeysArray = Array.isArray(updatedPasskeys) 
              ? updatedPasskeys 
              : (updatedPasskeys?.data && Array.isArray(updatedPasskeys.data) ? updatedPasskeys.data : []);
            
            const passkeyStillExists = passkeysArray.some((p: any) => p.id === passkeyId);
            if (!passkeyStillExists) {
              // Passkey was deleted successfully despite the error
              setPasskeySuccess("Passkey deleted successfully!");
              setPasskeyError(null);
              await loadPasskeys();
            } else {
              // Passkey still exists, show error
              setPasskeyError(err?.message ?? err?.error?.message ?? "Failed to delete passkey");
            }
          }, 100);
        } finally {
          setDeletingPasskeyId(null);
        }
      },
    });
  };

  const handleEnable2FA = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!session) return;

    // For OAuth users, try to enable without password
    if (isOAuthUser) {
      setEnabling2FA(true);
      setTwoFactorError(null);
      setTwoFactorSuccess(null);

      try {
        // Try enabling without password - better-auth may allow this for OAuth users
        const result = await authClient.twoFactor.enable({
          password: "", // Empty password for OAuth users
          issuer: "Studojo",
        });

        if (result.error) {
          // If it fails, show a helpful message
          if (result.error.message?.toLowerCase().includes("password") || result.error.status === 400) {
            setTwoFactorError("Two-factor authentication is not available for accounts signed in with Google. Please create a password account to enable 2FA.");
          } else {
            setTwoFactorError(result.error.message ?? "Failed to enable 2FA");
          }
        } else if (result.data) {
          setTwoFactorSetup({
            totpURI: result.data.totpURI,
            backupCodes: result.data.backupCodes ?? [],
          });
          setBackupCodes(result.data.backupCodes ?? []);
          setShowBackupCodes(true);
        }
      } catch (err) {
        setTwoFactorError("Two-factor authentication requires a password account. OAuth-only accounts cannot enable 2FA at this time.");
      } finally {
        setEnabling2FA(false);
      }
      return;
    }

    // For password accounts, require password
    if (!twoFactorPassword) return;

    setEnabling2FA(true);
    setTwoFactorError(null);
    setTwoFactorSuccess(null);

    try {
      const result = await authClient.twoFactor.enable({
        password: twoFactorPassword,
        issuer: "Studojo",
      });

      if (result.error) {
        setTwoFactorError(result.error.message ?? "Failed to enable 2FA");
      } else if (result.data) {
        setTwoFactorSetup({
          totpURI: result.data.totpURI,
          backupCodes: result.data.backupCodes ?? [],
        });
        setBackupCodes(result.data.backupCodes ?? []);
        setShowBackupCodes(true);
        setTwoFactorPassword("");
      }
    } catch (err) {
      setTwoFactorError(err instanceof Error ? err.message : "Failed to enable 2FA");
    } finally {
      setEnabling2FA(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session || !twoFactorCode) return;

    setVerifying2FA(true);
    setTwoFactorError(null);

    try {
      const result = await authClient.twoFactor.verifyTotp({
        code: twoFactorCode.trim(),
      });

      if (result.error) {
        setTwoFactorError(result.error.message ?? "Invalid code. Please try again.");
      } else {
        setTwoFactorSuccess("Two-factor authentication enabled successfully!");
        setTwoFactorSetup(null);
        setTwoFactorCode("");
        setTwoFactorEnabled(true);
        // Refresh session to get updated 2FA status
        await authClient.getSession();
      }
    } catch (err) {
      setTwoFactorError(err instanceof Error ? err.message : "Failed to verify code");
    } finally {
      setVerifying2FA(false);
    }
  };

  const handleDisable2FA = () => {
    if (!session) return;

    showConfirmModal({
      title: "Disable Two-Factor Authentication",
      message: "Are you sure you want to disable two-factor authentication? This will make your account less secure.",
      confirmText: "Disable 2FA",
      cancelText: "Cancel",
      destructive: true,
      onConfirm: async () => {
        setDisabling2FA(true);
        setTwoFactorError(null);
        setTwoFactorSuccess(null);

        try {
          const result = await authClient.twoFactor.disable();

          if (result.error) {
            setTwoFactorError(result.error.message ?? "Failed to disable 2FA");
          } else {
            setTwoFactorSuccess("Two-factor authentication disabled successfully.");
            setTwoFactorEnabled(false);
            setBackupCodes([]);
            setShowBackupCodes(false);
            // Refresh session
            await authClient.getSession();
          }
        } catch (err) {
          setTwoFactorError(err instanceof Error ? err.message : "Failed to disable 2FA");
        } finally {
          setDisabling2FA(false);
        }
      },
    });
  };

  const handleGenerateBackupCodes = async () => {
    if (!session) return;

    setGeneratingBackupCodes(true);
    setTwoFactorError(null);

    try {
      const result = await authClient.twoFactor.generateBackupCodes();

      if (result.error) {
        setTwoFactorError(result.error.message ?? "Failed to generate backup codes");
      } else if (result.data?.backupCodes) {
        setBackupCodes(result.data.backupCodes);
        setShowBackupCodes(true);
        setTwoFactorSuccess("New backup codes generated. Please save them securely.");
      }
    } catch (err) {
      setTwoFactorError(err instanceof Error ? err.message : "Failed to generate backup codes");
    } finally {
      setGeneratingBackupCodes(false);
    }
  };

  if (sessionPending || !session) {
    return null;
  }

  const qrCodeUrl = twoFactorSetup?.totpURI
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFactorSetup.totpURI)}`
    : null;

  return (
    <>
      <Header />
      <main className="relative min-h-screen overflow-hidden bg-purple-50">
        <div className="relative mx-auto max-w-4xl px-4 py-12 md:px-8 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h1 className="mb-8 font-['Clash_Display'] text-4xl font-medium leading-tight tracking-tight text-neutral-900 md:text-5xl">
              Settings
            </h1>

            <div className="space-y-6">
              {/* Passkeys Section */}
              <div className="rounded-2xl border-2 border-neutral-900 bg-white p-6 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] md:p-8">
                <h2 className="mb-4 font-['Clash_Display'] text-2xl font-medium leading-tight tracking-tight text-neutral-900">
                  Passkeys
                </h2>
                <p className="mb-6 font-['Satoshi'] text-base font-normal leading-6 text-neutral-700">
                  Passkeys provide a secure, passwordless way to sign in. Add a passkey to use biometric authentication or a security key.
                </p>

                {passkeyError && (
                  <div
                    className="mb-4 rounded-xl border-2 border-red-500 bg-red-50 px-4 py-3 font-['Satoshi'] text-sm font-medium leading-5 text-red-700"
                    role="alert"
                  >
                    {passkeyError}
                  </div>
                )}

                {passkeySuccess && (
                  <div
                    className="mb-4 rounded-xl border-2 border-green-500 bg-green-50 px-4 py-3 font-['Satoshi'] text-sm font-medium leading-5 text-green-700"
                    role="alert"
                  >
                    {passkeySuccess}
                  </div>
                )}

                {/* Add Passkey Form */}
                <div className="mb-6 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={passkeyName}
                    onChange={(e) => setPasskeyName(e.target.value)}
                    placeholder="Passkey name (optional)"
                    className="flex-1 rounded-xl border-2 border-neutral-900 bg-white px-4 py-3 font-['Satoshi'] text-base font-normal leading-6 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  />
                  <button
                    type="button"
                    onClick={handleAddPasskey}
                    disabled={addingPasskey}
                    className="rounded-2xl border-2 border-neutral-900 bg-purple-500 px-6 py-3 font-['Satoshi'] text-base font-medium leading-6 text-white shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {addingPasskey ? "Adding…" : "Add Passkey"}
                  </button>
                </div>

                {/* Passkeys List */}
                {loadingPasskeys ? (
                  <p className="font-['Satoshi'] text-sm font-normal leading-5 text-neutral-500">Loading passkeys…</p>
                ) : passkeys.length === 0 ? (
                  <p className="font-['Satoshi'] text-sm font-normal leading-5 text-neutral-500">No passkeys registered yet.</p>
                ) : (
                  <div className="space-y-3">
                    {passkeys.map((passkey) => (
                      <div
                        key={passkey.id}
                        className="flex items-center justify-between rounded-xl border-2 border-neutral-200 bg-neutral-50 px-4 py-3"
                      >
                        <div className="flex-1">
                          <p className="font-['Satoshi'] text-base font-medium leading-6 text-neutral-900">
                            {passkey.name || "Unnamed passkey"}
                          </p>
                          <p className="font-['Satoshi'] text-sm font-normal leading-5 text-neutral-500">
                            {passkey.deviceType} {passkey.createdAt ? `• Added ${new Date(passkey.createdAt).toLocaleDateString()}` : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeletePasskey(passkey.id)}
                          disabled={deletingPasskeyId === passkey.id}
                          className="ml-4 rounded-lg border-2 border-red-500 bg-white px-4 py-2 font-['Satoshi'] text-sm font-medium leading-5 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 disabled:pointer-events-none"
                          aria-label={`Delete ${passkey.name || "passkey"}`}
                        >
                          {deletingPasskeyId === passkey.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Two-Factor Authentication Section */}
              <div className="rounded-2xl border-2 border-neutral-900 bg-white p-6 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] md:p-8">
                <h2 className="mb-4 font-['Clash_Display'] text-2xl font-medium leading-tight tracking-tight text-neutral-900">
                  Two-Factor Authentication
                </h2>
                <p className="mb-6 font-['Satoshi'] text-base font-normal leading-6 text-neutral-700">
                  Add an extra layer of security to your account. When enabled, you'll need to enter a code from your authenticator app in addition to your password.
                </p>

                {twoFactorError && (
                  <div
                    className="mb-4 rounded-xl border-2 border-red-500 bg-red-50 px-4 py-3 font-['Satoshi'] text-sm font-medium leading-5 text-red-700"
                    role="alert"
                  >
                    {twoFactorError}
                  </div>
                )}

                {twoFactorSuccess && (
                  <div
                    className="mb-4 rounded-xl border-2 border-green-500 bg-green-50 px-4 py-3 font-['Satoshi'] text-sm font-medium leading-5 text-green-700"
                    role="alert"
                  >
                    {twoFactorSuccess}
                  </div>
                )}

                {!twoFactorEnabled && !twoFactorSetup ? (
                  <>
                    {isOAuthUser ? (
                      <div className="rounded-xl border-2 border-amber-500 bg-amber-50 px-4 py-3">
                        <p className="font-['Satoshi'] text-sm font-medium leading-5 text-amber-900">
                          Two-factor authentication is not available for accounts signed in with Google OAuth.
                        </p>
                        <p className="mt-2 font-['Satoshi'] text-xs font-normal leading-4 text-amber-800">
                          To enable 2FA, you'll need to create a password for your account by signing out and creating a new account with email and password, or contact support for assistance.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleEnable2FA} className="space-y-4">
                        <div>
                          <label htmlFor="password" className="mb-2 block font-['Satoshi'] text-sm font-medium leading-5 text-neutral-900">
                            Enter your password to enable 2FA
                          </label>
                          <input
                            type="password"
                            id="password"
                            value={twoFactorPassword}
                            onChange={(e) => setTwoFactorPassword(e.target.value)}
                            required
                            className="w-full rounded-xl border-2 border-neutral-900 bg-white px-4 py-3 font-['Satoshi'] text-base font-normal leading-6 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                            placeholder="••••••••"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={enabling2FA || !twoFactorPassword}
                          className="rounded-2xl border-2 border-neutral-900 bg-purple-500 px-6 py-4 font-['Satoshi'] text-base font-medium leading-6 text-white shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-60 disabled:pointer-events-none"
                        >
                          {enabling2FA ? "Enabling…" : "Enable 2FA"}
                        </button>
                      </form>
                    )}
                  </>
                ) : twoFactorSetup && !twoFactorEnabled ? (
                  <div className="space-y-6">
                    <div>
                      <p className="mb-4 font-['Satoshi'] text-base font-medium leading-6 text-neutral-900">
                        Scan this QR code with your authenticator app:
                      </p>
                      {qrCodeUrl && (
                        <div className="mb-4 flex justify-center">
                          <img src={qrCodeUrl} alt="2FA QR Code" className="rounded-xl border-2 border-neutral-900" />
                        </div>
                      )}
                      <p className="mb-4 font-['Satoshi'] text-sm font-normal leading-5 text-neutral-600">
                        Or enter this code manually: <code className="font-mono text-xs break-all">{twoFactorSetup.totpURI.split("secret=")[1]?.split("&")[0] || "Unable to parse"}</code>
                      </p>
                    </div>

                    {showBackupCodes && backupCodes.length > 0 && (
                      <div className="rounded-xl border-2 border-amber-500 bg-amber-50 p-4">
                        <p className="mb-2 font-['Satoshi'] text-sm font-bold leading-5 text-amber-900">
                          Save these backup codes securely:
                        </p>
                        <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                          {backupCodes.map((code, i) => (
                            <div key={i} className="rounded bg-white px-2 py-1 text-center">
                              {code}
                            </div>
                          ))}
                        </div>
                        <p className="mt-2 font-['Satoshi'] text-xs font-normal leading-4 text-amber-800">
                          You can use these codes to sign in if you lose access to your authenticator app.
                        </p>
                      </div>
                    )}

                    <form onSubmit={handleVerify2FA} className="space-y-4">
                      <div>
                        <label htmlFor="totp-code" className="mb-2 block font-['Satoshi'] text-sm font-medium leading-5 text-neutral-900">
                          Enter the code from your authenticator app
                        </label>
                        <input
                          type="text"
                          id="totp-code"
                          value={twoFactorCode}
                          onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="000000"
                          maxLength={6}
                          required
                          className="w-full rounded-xl border-2 border-neutral-900 bg-white px-4 py-3 font-['Satoshi'] text-base font-mono tracking-widest text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={verifying2FA || twoFactorCode.length < 6}
                        className="rounded-2xl border-2 border-neutral-900 bg-purple-500 px-6 py-4 font-['Satoshi'] text-base font-medium leading-6 text-white shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-60 disabled:pointer-events-none"
                      >
                        {verifying2FA ? "Verifying…" : "Verify & Enable"}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="font-['Satoshi'] text-base font-medium leading-6 text-neutral-900">
                        Two-factor authentication is enabled
                      </p>
                    </div>

                    {showBackupCodes && backupCodes.length > 0 && (
                      <div className="rounded-xl border-2 border-amber-500 bg-amber-50 p-4">
                        <p className="mb-2 font-['Satoshi'] text-sm font-bold leading-5 text-amber-900">
                          Backup codes:
                        </p>
                        <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                          {backupCodes.map((code, i) => (
                            <div key={i} className="rounded bg-white px-2 py-1 text-center">
                              {code}
                            </div>
                          ))}
                        </div>
                        <p className="mt-2 font-['Satoshi'] text-xs font-normal leading-4 text-amber-800">
                          Save these codes securely. They can only be viewed once.
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={handleGenerateBackupCodes}
                        disabled={generatingBackupCodes}
                        className="rounded-2xl border-2 border-neutral-900 bg-white px-6 py-3 font-['Satoshi'] text-base font-medium leading-6 text-neutral-900 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-60 disabled:pointer-events-none"
                      >
                        {generatingBackupCodes ? "Generating…" : "Generate New Backup Codes"}
                      </button>
                      <button
                        type="button"
                        onClick={handleDisable2FA}
                        disabled={disabling2FA}
                        className="rounded-2xl border-2 border-red-500 bg-white px-6 py-3 font-['Satoshi'] text-base font-medium leading-6 text-red-600 shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(220,38,38,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:opacity-60 disabled:pointer-events-none"
                      >
                        {disabling2FA ? "Disabling…" : "Disable 2FA"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Confirm Modal */}
      <AnimatePresence>
        {modalOpen && modalConfig && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleModalCancel}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              aria-hidden="true"
            />
            
            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative w-full max-w-md rounded-2xl border-2 border-neutral-900 bg-white p-6 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] md:p-8"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="mb-4 font-['Clash_Display'] text-2xl font-medium leading-tight tracking-tight text-neutral-900">
                  {modalConfig.title}
                </h3>
                <p className="mb-6 font-['Satoshi'] text-base font-normal leading-6 text-neutral-700">
                  {modalConfig.message}
                </p>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={handleModalCancel}
                    className="rounded-2xl border-2 border-neutral-900 bg-white px-6 py-3 font-['Satoshi'] text-base font-medium leading-6 text-neutral-900 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                  >
                    {modalConfig.cancelText || "Cancel"}
                  </button>
                  <button
                    type="button"
                    onClick={handleModalConfirm}
                    className={`rounded-2xl border-2 px-6 py-3 font-['Satoshi'] text-base font-medium leading-6 text-white shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${
                      modalConfig.destructive
                        ? "border-red-500 bg-red-500 shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] hover:shadow-[2px_2px_0px_0px_rgba(220,38,38,1)]"
                        : "border-neutral-900 bg-purple-500"
                    }`}
                  >
                    {modalConfig.confirmText || "Confirm"}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
