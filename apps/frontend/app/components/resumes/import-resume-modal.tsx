import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { FiX, FiUpload } from "react-icons/fi";
import { toast } from "sonner";

type ImportResumeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onImport: (resumeData: any) => void;
};

const floatY = [0, -24, -12, -30, 0];
const floatX = [0, 12, -18, 8, 0];
const floatRotate = [0, 6, -8, 4, 0];

const PROCESSING_SHAPES = [
  { className: "right-4 top-8 h-12 w-12 rounded-full bg-emerald-300", shadow: "4px_4px" as const, duration: 18, delay: 0 },
  { className: "left-4 top-1/3 h-10 w-10 bg-emerald-500", shadow: "3px_3px" as const, rotate: 12, duration: 22, delay: 1 },
  { className: "bottom-8 right-1/4 h-8 w-8 rounded-2xl bg-emerald-400", shadow: "3px_3px" as const, duration: 20, delay: 2 },
  { className: "bottom-1/4 left-4 h-10 w-10 rounded-full bg-emerald-300", shadow: "4px_4px" as const, rotate: 45, duration: 24, delay: 0.5 },
  { className: "top-1/2 right-1/3 h-8 w-8 bg-emerald-500", shadow: "3px_3px" as const, rotate: -12, duration: 19, delay: 1.5 },
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
      className={`absolute rounded-2xl border-2 border-neutral-900 opacity-30 ${shadowClass} ${className}`}
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

function AnimatedUploadIcon() {
  return (
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <FiUpload className="h-5 w-5" />
    </motion.div>
  );
}

function ProcessingIndicator() {
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        className="flex gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-emerald-500"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>
      <motion.p
        className="font-['Satoshi'] text-sm font-medium text-emerald-600"
        animate={{
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        Processing PDF with AI...
      </motion.p>
    </div>
  );
}

export function ImportResumeModal({
  isOpen,
  onClose,
  onImport,
}: ImportResumeModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate PDF file
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      toast.error("Only PDF files are supported");
      return;
    }

    setIsProcessing(true);
    try {
      // Upload PDF and parse with OpenAI
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/resumes/parse", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let errorMessage = "Failed to parse PDF";
        try {
          const error = await res.json();
          errorMessage = error.error || errorMessage;
        } catch {
          // If response isn't JSON, use status text
          errorMessage = res.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      if (!data.resumeData) {
        throw new Error("No resume data returned from server");
      }
      handleImport(data.resumeData);
    } catch (error: any) {
      toast.error(error.message || "Failed to parse file");
      console.error("File parse error:", error);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleImport = (resumeData: any) => {
    // Basic validation
    if (!resumeData || typeof resumeData !== "object") {
      toast.error("Invalid resume data");
      return;
    }

    // Validate required fields
    if (!resumeData.title && !resumeData.contact_info) {
      toast.error("Resume must have at least a title or contact_info");
      return;
    }

    try {
      onImport(resumeData);
      toast.success("Resume imported successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to import resume");
      console.error("Import error:", error);
    }
  };


  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl rounded-2xl bg-white shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] outline outline-2 outline-offset-[-2px] outline-black"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-black px-6 py-4">
                <h2 className="font-['Clash_Display'] text-2xl font-medium leading-8 tracking-tight text-neutral-950">
                  Import Resume
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100"
                >
                  <FiX className="h-5 w-5 text-neutral-950" />
                </button>
              </div>

              {/* Content */}
              <div className="relative p-6">
                {/* Floating shapes during processing */}
                {isProcessing && (
                  <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none" aria-hidden="true">
                    {PROCESSING_SHAPES.map((shape, i) => (
                      <FloatShape key={i} {...shape} />
                    ))}
                  </div>
                )}

                {/* PDF Upload */}
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="mb-2 block font-['Satoshi'] text-xs font-medium uppercase leading-4 tracking-tight text-gray-600">
                      Upload PDF Resume
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileUpload}
                      disabled={isProcessing}
                      className="hidden"
                      id="file-upload"
                    />
                    <motion.label
                      htmlFor="file-upload"
                      className={`relative flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-gray-50 py-8 font-['Satoshi'] text-sm font-medium leading-5 transition-colors ${
                        isProcessing
                          ? "border-emerald-500 bg-emerald-50 cursor-not-allowed"
                          : "border-gray-300 text-gray-600 hover:border-emerald-500 hover:bg-emerald-50"
                      }`}
                      animate={isProcessing ? {
                        scale: [1, 1.02, 1],
                      } : {}}
                      transition={{
                        duration: 2,
                        repeat: isProcessing ? Infinity : 0,
                        ease: "easeInOut",
                      }}
                    >
                      {isProcessing ? (
                        <ProcessingIndicator />
                      ) : (
                        <>
                          <AnimatedUploadIcon />
                          <span>Click to upload PDF resume</span>
                        </>
                      )}
                    </motion.label>
                    <p className="mt-2 text-center font-['Satoshi'] text-xs font-normal leading-4 text-gray-500">
                      We'll use AI to extract and structure your resume data
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
