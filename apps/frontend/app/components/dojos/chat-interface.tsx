import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { FiMessageCircle, FiPaperclip, FiSend, FiX } from "react-icons/fi";
import {
  ControlPlaneError,
  getJob,
  submitJob,
  generateOutline,
  editOutline,
  type JobResponse,
  type SubmitPayload,
  type OutlineResponse,
  type OutlineEditResponse,
} from "~/lib/control-plane";
import {
  createPaymentOrder,
  openRazorpayCheckout,
  verifyPayment,
  PaymentError,
} from "~/lib/payments";
import { trackEvent } from "~/lib/mixpanel";
import { authClient } from "~/lib/auth-client";

type Phase = "idle" | "questions" | "generating_outline" | "outline_ready" | "editing_outline" | "ready_for_payment" | "processing_payment" | "generating" | "polling" | "success" | "error";
type Status = Phase; // Keep for backward compatibility

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  status?: "sending" | "sent" | "error";
};

const POLL_INTERVAL_MS = 3000;
const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 10;
const ASSIGNMENT_PRICE_PAISE = 13900; // ₹139

function buildPayload(description: string): SubmitPayload {
  return {
    assignment_type: "essay",
    description,
    length_words: 1500,
    format_style: "APA",
    allow_web_search: true,
    humanizer_config: { enabled: true, intensity: "light" },
  };
}

interface ChatInterfaceProps {
  onFirstMessage?: () => void;
}

export function ChatInterface({ onFirstMessage }: ChatInterfaceProps = { onFirstMessage: undefined }) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [status, setStatus] = useState<Status>("idle"); // Keep for backward compatibility, sync with phase
  const [outline, setOutline] = useState<any | null>(null);
  const [outlineJobId, setOutlineJobId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<JobResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => clearPoll(), [clearPoll]);

  const handle401 = useCallback(() => {
    setErrorMessage("Please sign in again.");
    setStatus("idle");
    setJobId(null);
    clearPoll();
    navigate("/auth", { replace: true });
  }, [clearPoll, navigate]);

  const reset = useCallback(() => {
    setInput("");
    setFiles([]);
    setMessages([]);
    setPhase("idle");
    setStatus("idle");
    setOutline(null);
    setOutlineJobId(null);
    setJobId(null);
    setJob(null);
    setErrorMessage(null);
    clearPoll();
  }, [clearPoll]);
  
  // Sync status with phase
  useEffect(() => {
    setStatus(phase as Status);
  }, [phase]);

  // Scroll messages container to bottom when messages change (not the whole page)
  useEffect(() => {
    if (messagesContainerRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      });
    }
  }, [messages]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 192); // 12rem max
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  const addFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles?.length) return;
    const list = Array.from(newFiles);
    const valid: File[] = [];
    const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
    for (const f of list) {
      if (f.size > maxBytes) continue;
      valid.push(f);
    }
    setFiles((prev) => {
      const next = [...prev, ...valid].slice(0, MAX_FILES);
      return next;
    });
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const busy = phase === "generating_outline" || phase === "editing_outline" || phase === "processing_payment" || phase === "generating" || phase === "polling";

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!busy) setDragOver(true);
    },
    [busy]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      if (busy) return;
      addFiles(e.dataTransfer.files);
    },
    [busy, addFiles]
  );

  const addMessage = useCallback((role: "user" | "assistant", content: string, status?: Message["status"]) => {
    const message: Message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      role,
      content,
      timestamp: new Date(),
      status,
    };
    setMessages((prev) => {
      const newMessages = [...prev, message];
      // Notify parent on first user message
      if (role === "user" && prev.length === 0 && onFirstMessage) {
        onFirstMessage();
      }
      return newMessages;
    });
    return message.id;
  }, [onFirstMessage]);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    const userMessage = input.trim();
    if (!userMessage || phase === "generating_outline" || phase === "processing_payment" || phase === "generating" || phase === "polling")
      return;

    // Add user message
    const userMsgId = addMessage("user", userMessage);
    setInput("");
    setErrorMessage(null);

    try {
      if (phase === "idle" || phase === "questions") {
        // Initial description - generate outline
        setPhase("generating_outline");
        const outlineMsgId = addMessage("assistant", "Generating outline for your assignment...", "sending");
        
        const payload = buildPayload(userMessage);
        const outlineRes = await generateOutline(payload);
        
        setOutlineJobId(outlineRes.job_id);
        
        // Poll for outline result
        let outlineResult: OutlineResponse | null = null;
        let pollCount = 0;
        const maxPolls = 100;
        let lastJobStatus = "";
        
        while (pollCount < maxPolls) {
          await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
          const job = await getJob(outlineRes.job_id);
          lastJobStatus = job.status;
          
          // Log status every 10 polls for debugging
          if (pollCount % 10 === 0) {
            console.log(`[Outline Poll] Attempt ${pollCount + 1}/${maxPolls}, Status: ${job.status}`, job.result ? "Has result" : "No result", job.result);
          }
          
          if (job.status === "COMPLETED") {
            console.log("[Outline Poll] Job completed, checking result:", job.result, typeof job.result);
            if (job.result) {
              // Try to extract outline from result
              let outline = null;
              if (typeof job.result === "object" && job.result !== null) {
                outline = (job.result as any).outline;
                console.log("[Outline Poll] Extracted outline:", outline ? "Found" : "Not found", job.result);
              } else {
                console.warn("[Outline Poll] Result is not an object:", typeof job.result, job.result);
              }
              if (outline) {
                outlineResult = { job_id: job.job_id, status: job.status, outline };
                console.log("[Outline Poll] Successfully extracted outline, breaking loop");
                break;
              } else {
                // Job completed but no outline in result - might be a data structure issue
                console.warn("[Outline Poll] Job completed but result structure unexpected:", JSON.stringify(job.result, null, 2));
              }
            } else {
              console.warn("[Outline Poll] Job completed but no result field");
            }
          } else if (job.status === "FAILED") {
            throw new Error(job.error || "Outline generation failed");
          }
          pollCount++;
        }
        
        if (!outlineResult || !outlineResult.outline) {
          throw new Error(`Outline generation timed out or failed. Last job status: ${lastJobStatus}. The backend may need to be restarted to process the result.`);
        }
        
        setOutline(outlineResult.outline);
        setPhase("outline_ready");
        
        // Format outline for display
        const outlineText = formatOutline(outlineResult.outline);
        updateMessage(outlineMsgId, {
          content: `Here's your assignment outline:\n\n${outlineText}\n\nYou can ask me to modify it (e.g., "add a section about X" or "remove section 2"). When you're ready, say "generate" or "ready" to proceed with payment.`,
          status: "sent",
        });
        
      } else if (phase === "outline_ready" || phase === "editing_outline") {
        // Check if user wants to generate
        const lowerMsg = userMessage.toLowerCase();
        if (lowerMsg === "generate" || lowerMsg === "ready" || lowerMsg === "done" || lowerMsg.includes("generate") || lowerMsg.includes("ready")) {
          // Show payment
          setPhase("ready_for_payment");
          const paymentMsgId = addMessage("assistant", "Ready to generate your assignment! Payment of ₹139 is required. Opening payment...", "sending");
          
          const orderRes = await createPaymentOrder(ASSIGNMENT_PRICE_PAISE);
          console.log("Payment order response:", orderRes);
          setPhase("processing_payment");
          
          updateMessage(paymentMsgId, {
            content: "Please complete the payment to proceed.",
            status: "sent",
          });
          
          let paymentCompleted = false;
          let paymentFailed = false;
          
          // Use the server-created order_id
          const serverOrderId = orderRes.order_id;
          console.log("Server order ID:", serverOrderId);
          
          if (!serverOrderId) {
            console.error("No order_id in server response:", orderRes);
            updateMessage(paymentMsgId, {
              content: "Failed to create payment order. Please try again.",
              status: "error",
            });
            setErrorMessage("Failed to create payment order");
            setPhase("outline_ready");
            return;
          }
          
          await openRazorpayCheckout({
            key: orderRes.key_id,
            amount: orderRes.amount,
            currency: "INR",
            name: "Studojo",
            description: "Assignment Generation",
            order_id: serverOrderId, // Use server-created order ID
            handler: async (response) => {
              // Debug: Log the actual response structure
              console.log("Razorpay handler response:", response);
              
              // Check if this is a valid payment response
              // Use server-created order_id since Razorpay may not return it
              const paymentId = response?.razorpay_payment_id || response?.payment_id || response?.razorpayPaymentId;
              const signature = response?.razorpay_signature || response?.signature || response?.razorpaySignature;
              
              // Use the order_id from server response
              const orderId = serverOrderId;
              
              console.log("Payment verification data:", { orderId, paymentId, signature });
              
              if (!response || !orderId || !paymentId || !signature) {
                // Invalid response - log for debugging
                console.error("Invalid Razorpay response:", {
                  hasResponse: !!response,
                  paymentId: !!paymentId,
                  signature: !!signature,
                  fullResponse: JSON.stringify(response, null, 2)
                });
                
                paymentFailed = true;
                updateMessage(paymentMsgId, {
                  content: "Payment response incomplete. Please try again.",
                  status: "error",
                });
                setErrorMessage("Payment response incomplete. Please try again.");
                setPhase("outline_ready");
                return;
              }
              
              paymentCompleted = true;
              try {
                updateMessage(paymentMsgId, {
                  content: "Payment received! Verifying...",
                  status: "sending",
                });
                
                const verifyResult = await verifyPayment(
                  orderId,
                  paymentId,
                  signature
                );
                
                // Track purchase event
                const session = authClient.getSession();
                const amountInRupees = orderRes.amount / 100; // Convert paise to rupees
                trackEvent("Purchase", {
                  user_id: session?.user?.id,
                  transaction_id: paymentId,
                  revenue: amountInRupees,
                  currency: "INR",
                });
                
                updateMessage(paymentMsgId, {
                  content: "Payment verified! Starting assignment generation...",
                  status: "sent",
                });
                
                setPhase("generating");
                const payload = buildPayload(messages.find(m => m.role === "user")?.content || "");
                const { res, status: httpStatus } = await submitJob(payload, orderId, outline);
                
                if (httpStatus === 401) {
                  handle401();
                  return;
                }
                
                if (httpStatus === 200 && res.result != null) {
                  setJob({
                    job_id: res.job_id,
                    status: res.status,
                    created_at: res.created_at,
                    updated_at: res.created_at,
                    result: res.result,
                  });
                  setPhase("success");
                  return;
                }
                
                setJobId(res.job_id);
                setPhase("polling");
              } catch (e) {
                paymentFailed = true;
                if (e instanceof ControlPlaneError && e.status === 401) {
                  handle401();
                  return;
                }
                if (e instanceof PaymentError) {
                  updateMessage(paymentMsgId, {
                    content: `Payment error: ${e.message}`,
                    status: "error",
                  });
                  setErrorMessage(e.message);
                  setPhase("outline_ready");
                  return;
                }
                const errorMsg = e instanceof Error ? e.message : "Something went wrong.";
                updateMessage(paymentMsgId, {
                  content: `Error: ${errorMsg}`,
                  status: "error",
                });
                setErrorMessage(errorMsg);
                setPhase("outline_ready");
              }
            },
            onPaymentFailed: (response: any) => {
              paymentFailed = true;
              updateMessage(paymentMsgId, {
                content: `Payment failed: ${response.error?.description || response.error?.reason || "Unknown error"}`,
                status: "error",
              });
              setErrorMessage(response.error?.description || response.error?.reason || "Payment failed");
              setPhase("outline_ready");
            },
            theme: { color: "#7c3aed" },
            onDismiss: () => {
              // Only show cancellation message if payment wasn't completed or failed
              if (!paymentCompleted && !paymentFailed) {
                updateMessage(paymentMsgId, {
                  content: "Payment cancelled. You can try again when ready.",
                  status: "sent",
                });
                setPhase("outline_ready");
              }
            },
          });
          
        } else {
          // Edit outline
          setPhase("editing_outline");
          const editMsgId = addMessage("assistant", "Updating outline...", "sending");
          
          const editRes = await editOutline(outline!, userMessage);
          
          // Poll for edit result
          let editResult: OutlineEditResponse | null = null;
          let pollCount = 0;
          const maxPolls = 50;
          
          while (pollCount < maxPolls) {
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
            const job = await getJob(editRes.job_id);
            
            if (job.status === "COMPLETED" && job.result) {
              editResult = {
                job_id: job.job_id,
                status: job.status,
                outline: (job.result as any).outline,
                assistant_message: (job.result as any).assistant_message,
              };
              break;
            } else if (job.status === "FAILED") {
              throw new Error(job.error || "Outline editing failed");
            }
            pollCount++;
          }
          
          if (!editResult || !editResult.outline) {
            throw new Error("Outline editing timed out or failed");
          }
          
          setOutline(editResult.outline);
          const outlineText = formatOutline(editResult.outline);
          updateMessage(editMsgId, {
            content: `${editResult.assistant_message || "Outline updated."}\n\n${outlineText}\n\nYou can continue editing or say "generate" when ready.`,
            status: "sent",
          });
          setPhase("outline_ready");
        }
      }
    } catch (e) {
      if (e instanceof ControlPlaneError && e.status === 401) {
        handle401();
        return;
      }
      const errorMsg = e instanceof Error ? e.message : "Something went wrong.";
      addMessage("assistant", `Error: ${errorMsg}`, "error");
      setErrorMessage(errorMsg);
      setPhase("error");
    }
  }, [input, phase, outline, messages, handle401, addMessage, updateMessage]);

  const formatOutline = (outline: any): string => {
    if (!outline || !outline.sections) return "No outline available.";
    const sections = outline.sections;
    let text = "OUTLINE:\n";
    sections.forEach((section: any, idx: number) => {
      text += `\n${idx + 1}. ${section.title || `Section ${idx + 1}`}`;
      if (section.target_words) {
        text += ` (${section.target_words} words)`;
      }
      if (section.subsections && section.subsections.length > 0) {
        section.subsections.forEach((sub: any, subIdx: number) => {
          text += `\n   ${idx + 1}.${subIdx + 1}. ${sub.title || `Subsection ${subIdx + 1}`}`;
          if (sub.target_words) {
            text += ` (${sub.target_words} words)`;
          }
        });
      }
    });
    return text;
  };

  useEffect(() => {
    if (phase !== "polling" || !jobId) return;

    let pollCount = 0;
    const MAX_POLLS = 200; // ~10 minutes max (200 * 3s)
    let lastStatus = "";

    const poll = async () => {
      try {
        pollCount++;
        const j = await getJob(jobId);
        setJob(j); // Update job state to show current status
        
        // Update message if status changed
        if (j.status !== lastStatus) {
          lastStatus = j.status;
          if (j.status === "QUEUED") {
            addMessage("assistant", "Your assignment is queued and will start processing shortly...");
          } else if (j.status === "RUNNING") {
            addMessage("assistant", "Generating your assignment... This may take a few minutes.");
          }
        }
        
        // Handle terminal states
        if (j.status === "COMPLETED") {
          clearPoll();
          addMessage("assistant", "Your assignment is ready! Click the download button below.");
          setPhase("success");
          setStatus("success");
          return;
        }
        if (j.status === "FAILED") {
          clearPoll();
          const errorMsg = j.error ?? "Job failed.";
          addMessage("assistant", `Sorry, generation failed: ${errorMsg}`, "error");
          setErrorMessage(errorMsg);
          setPhase("error");
          setStatus("error");
          return;
        }
        
        // Timeout after max polls
        if (pollCount >= MAX_POLLS) {
          clearPoll();
          const timeoutMsg = "Generation is taking longer than expected. Please try again.";
          addMessage("assistant", timeoutMsg, "error");
          setErrorMessage(timeoutMsg);
          setPhase("error");
          setStatus("error");
          return;
        }
        
        // Continue polling for QUEUED or RUNNING
      } catch (e) {
        if (e instanceof ControlPlaneError && e.status === 401) {
          handle401();
          return;
        }
        // On error, stop polling and show error
        clearPoll();
        const errorMsg = e instanceof Error ? e.message : "Failed to check status.";
        addMessage("assistant", `Error: ${errorMsg}`, "error");
        setErrorMessage(errorMsg);
        setPhase("error");
        setStatus("error");
      }
    };

    void poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return clearPoll;
  }, [phase, jobId, clearPoll, handle401, addMessage]);

  const canSend = input.trim().length > 0 && !busy;
  const downloadUrl =
    job?.result && typeof job.result === "object" && "download_url" in job.result
      ? String((job.result as { download_url?: string }).download_url)
      : null;

  return (
    <div
      className={`w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] outline outline-[1.58px] outline-black outline-offset-[-1.58px] ${dragOver ? "ring-2 ring-violet-500 ring-offset-2" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.md"
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
        aria-hidden
      />
      {/* Messages area */}
      <div 
        ref={messagesContainerRef}
        className="flex max-h-[500px] min-h-[300px] flex-col overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center opacity-50">
              <FiMessageCircle
                className="h-12 w-12 text-gray-400"
                aria-hidden
              />
            </div>
            <p className="font-['Satoshi'] text-center text-base font-normal leading-6 text-gray-500">
              Start a conversation
            </p>
            <p className="max-w-sm text-center font-['Satoshi'] text-sm font-normal leading-5 text-gray-400">
              Tell me what kind of assignment you&apos;d like to create
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-violet-500 text-white"
                      : msg.status === "error"
                        ? "bg-red-50 text-red-700"
                        : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <div 
                    className="font-['Satoshi'] text-sm font-normal leading-5 whitespace-pre-wrap break-words"
                    style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
                  >
                    {msg.content}
                  </div>
                  {msg.status === "sending" && (
                    <div className="mt-2 flex gap-1">
                      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {(phase === "editing_outline" || phase === "polling") && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl bg-gray-100 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-violet-500" />
                    <p className="font-['Satoshi'] text-sm font-normal leading-5 text-gray-600">
                      {phase === "editing_outline"
                        ? "Updating outline..."
                        : job?.status === "QUEUED"
                          ? "Queued for processing..."
                          : job?.status === "RUNNING"
                            ? "Generating your assignment..."
                            : "Processing..."}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Success/Error actions */}
      {phase === "success" && downloadUrl && (
        <div className="border-t border-gray-200 px-4 py-4">
          <a
            href={downloadUrl}
            download
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 px-6 py-3 font-['Satoshi'] text-sm font-medium text-white shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] outline outline-[1.58px] outline-black outline-offset-[-1.58px] transition hover:bg-violet-600"
          >
            Download your assignment
          </a>
          <button
            type="button"
            onClick={reset}
            className="mt-2 w-full font-['Satoshi'] text-sm font-medium text-violet-600 underline hover:text-violet-700"
          >
            Create another
          </button>
        </div>
      )}

      {phase === "error" && (
        <div className="border-t border-gray-200 px-4 py-4">
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-2xl bg-violet-500 px-6 py-3 font-['Satoshi'] text-sm font-medium text-white shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] outline outline-[1.58px] outline-black outline-offset-[-1.58px] transition hover:bg-violet-600"
          >
            Try again
          </button>
        </div>
      )}

      {phase !== "success" && phase !== "error" && (
        <>
          {files.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-2">
              <ul className="flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <li
                    key={`${f.name}-${i}`}
                    className="flex items-center gap-1 rounded-lg bg-zinc-100 px-2 py-1 font-['Satoshi'] text-sm text-gray-700"
                  >
                    <span className="truncate max-w-[120px]" title={f.name}>
                      {f.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="shrink-0 rounded p-0.5 hover:bg-zinc-200"
                      aria-label={`Remove ${f.name}`}
                    >
                      <FiX className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-1 font-['Satoshi'] text-xs text-gray-500">
                File upload not yet sent to API. Coming soon.
              </p>
            </div>
          )}
          <div className="border-t border-gray-200 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-zinc-100 px-4 py-3 outline-none focus-within:ring-2 focus-within:ring-violet-500 focus-within:ring-offset-1">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSubmit();
                    }
                  }}
                  disabled={busy}
                  placeholder="Describe the assignment you want to create... (Shift+Enter for new line)"
                  className="font-['Satoshi'] w-full resize-none bg-transparent text-sm font-normal text-gray-900 placeholder:text-gray-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ 
                    minHeight: "2.5rem", 
                    maxHeight: "12rem",
                    height: "auto",
                    overflowY: "auto",
                  }}
                  aria-label="Assignment description"
                />
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => fileInputRef.current?.click()}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500 transition hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-violet-500"
                aria-label="Attach file"
              >
                <FiPaperclip className="h-5 w-5 text-white" />
              </button>
              <button
                type="button"
                disabled={!canSend}
                onClick={() => void handleSubmit()}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500 transition hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-violet-500"
                aria-label="Send"
              >
                <FiSend className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
