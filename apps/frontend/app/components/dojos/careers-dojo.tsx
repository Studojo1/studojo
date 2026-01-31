import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router";
import { FiDownload, FiUpload, FiSave } from "react-icons/fi";
import { toast } from "sonner";
import {
  CareersEditorSections,
  SECTION_IDS,
  type SectionId,
} from "./careers-editor-sections";
import { CareersFeatureCards } from "./careers-feature-cards";
import { CareersFloatingCardA, CareersFloatingCardB } from "./careers-floating-cards";
import { JobOptimizerToggle } from "./job-optimizer-toggle";
import { ImportResumeModal } from "../resumes";
import { optimizeResumeJob, getJob, submitResumeJob, type ResumeOptimizePayload, type ResumeGenPayload } from "~/lib/control-plane";

type ViewState = "default" | "optimizing" | "optimized";

function initialExpandedSections(): Record<SectionId, boolean> {
  return SECTION_IDS.reduce(
    (acc, id) => ({ ...acc, [id]: false }),
    {} as Record<SectionId, boolean>
  );
}

export function CareersDojoPage() {
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<ViewState>("default");
  const [jobOptimizerOn, setJobOptimizerOn] = useState(true);
  const [expandedSections, setExpandedSections] = useState(initialExpandedSections);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [currentResume, setCurrentResume] = useState<any>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [optimizationJobId, setOptimizationJobId] = useState<string | null>(null);
  const [packageJobId, setPackageJobId] = useState<string | null>(null);
  const [optimizedResume, setOptimizedResume] = useState<any>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const packagePollingRef = useRef<NodeJS.Timeout | null>(null);

  const toggleSection = (id: SectionId) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Load resume from URL param
  useEffect(() => {
    const resumeId = searchParams.get("resume");
    if (resumeId) {
      loadResume(resumeId);
    }
  }, [searchParams]);

  // Poll for package generation job
  useEffect(() => {
    if (!packageJobId) {
      if (packagePollingRef.current) {
        clearInterval(packagePollingRef.current);
        packagePollingRef.current = null;
      }
      return;
    }

    const pollPackageJob = async () => {
      try {
        const job = await getJob(packageJobId);
        if (job.status === "COMPLETED") {
          if (packagePollingRef.current) {
            clearInterval(packagePollingRef.current);
            packagePollingRef.current = null;
          }
          const result = job.result as any;
          if (result?.download_url) {
            setDownloadUrl(result.download_url);
            setView("optimized");
            toast.success("Resume package ready for download!");
          }
        } else if (job.status === "FAILED") {
          if (packagePollingRef.current) {
            clearInterval(packagePollingRef.current);
            packagePollingRef.current = null;
          }
          toast.error(job.error || "Package generation failed");
        }
      } catch (error) {
        console.error("Package polling error:", error);
      }
    };

    packagePollingRef.current = setInterval(pollPackageJob, 2000);
    return () => {
      if (packagePollingRef.current) {
        clearInterval(packagePollingRef.current);
      }
    };
  }, [packageJobId]);

  // Poll for optimization job status
  useEffect(() => {
    if (!optimizationJobId || view !== "optimizing") {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    const pollJob = async () => {
      try {
        const job = await getJob(optimizationJobId);
        console.log("[careers-dojo] Polling optimization job:", {
          jobId: optimizationJobId,
          status: job.status,
          hasResult: !!job.result,
          resultType: typeof job.result,
          resultKeys: job.result && typeof job.result === "object" ? Object.keys(job.result) : null,
        });
        
        if (job.status === "COMPLETED") {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          // Parse the result - it might be a string or already an object
          let result: any = job.result;
          if (typeof result === "string") {
            try {
              result = JSON.parse(result);
            } catch (e) {
              console.warn("[careers-dojo] Failed to parse result as JSON:", e);
            }
          }
          
          // Check if this is a resume-gen result (has download_url) or resume-optimize result
          if (result && typeof result === "object" && "download_url" in result && result.download_url) {
            // This is a resume-gen result with download URL
            console.log("[careers-dojo] Got download URL:", result.download_url);
            setDownloadUrl(result.download_url);
            setView("optimized");
            toast.success("Resume package generated successfully!");
          } else if (result) {
            // This is a resume-optimize result - the result is the optimized resume JSON
            console.log("[careers-dojo] Got optimized resume, triggering package generation");
            const optimized = result;
            setOptimizedResume(optimized);
            setCurrentResume(optimized);
            
            // Trigger package generation with job info
            try {
              const payload: ResumeGenPayload = {
                resume: optimized,
                job_title: jobTitle,
                company: company,
                job_description: jobDescription,
              };
              console.log("[careers-dojo] Submitting package generation job");
              const { res: pkgRes } = await submitResumeJob(payload);
              setPackageJobId(pkgRes.job_id);
              toast.info("Generating resume package (Resume, Cover Letter, CV)...");
            } catch (error: any) {
              console.error("[careers-dojo] Failed to trigger package generation:", error);
              toast.error(error.message || "Failed to generate package");
              setView("default");
            }
          } else {
            console.warn("[careers-dojo] Job completed but no result found");
            toast.error("Optimization completed but no result was returned");
            setView("default");
          }
        } else if (job.status === "FAILED") {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          console.error("[careers-dojo] Optimization job failed:", job.error);
          toast.error(job.error || "Optimization failed");
          setView("default");
        }
      } catch (error) {
        console.error("[careers-dojo] Polling error:", error);
      }
    };

    pollingIntervalRef.current = setInterval(pollJob, 2000);
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [optimizationJobId, view]);

  const loadResume = async (id: string) => {
    try {
      const res = await fetch(`/api/resumes/${id}`);
      if (!res.ok) throw new Error("Failed to load resume");
      const data = await res.json();
      setCurrentResume(data.resume.resumeData);
      toast.success("Resume loaded");
    } catch (error) {
      toast.error("Failed to load resume");
      console.error(error);
    }
  };

  const handleImport = (resumeData: any) => {
    setCurrentResume(resumeData);
    toast.success("Resume imported");
  };

  const handleSaveResume = async () => {
    if (!currentResume) {
      toast.error("No resume to save");
      return;
    }

    try {
      const name = currentResume.title || currentResume.contact_info?.name || "My Resume";
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, resumeData: currentResume }),
      });
      if (!res.ok) throw new Error("Failed to save resume");
      toast.success("Resume saved successfully");
    } catch (error) {
      toast.error("Failed to save resume");
      console.error(error);
    }
  };

  const handleGenerateOrOptimize = async () => {
    if (!currentResume) {
      toast.error("Please import or create a resume first");
      setImportModalOpen(true);
      return;
    }

    if (jobOptimizerOn && (!jobTitle.trim() || !jobDescription.trim())) {
      toast.error("Please fill in job title and description for optimization");
      return;
    }

    setView("optimizing");
    setOptimizationJobId(null);
    setOptimizedResume(null);
    setDownloadUrl(null);

    try {
      if (jobOptimizerOn) {
        // Optimize resume
        const payload: ResumeOptimizePayload = {
          resume: currentResume,
          job_title: jobTitle,
          company: company,
          job_description: jobDescription,
        };
        const { res } = await optimizeResumeJob(payload);
        setOptimizationJobId(res.job_id);
        toast.info("Optimization started...");
      } else {
        // Generate package (resume-gen)
        const payload: ResumeGenPayload = {
          resume: currentResume,
        };
        const { res } = await submitResumeJob(payload);
        setPackageJobId(res.job_id);
        setView("optimizing");
        toast.info("Generating resume package...");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to start optimization");
      setView("default");
      console.error("Optimization error:", error);
    }
  };


  const handleDownload = () => {
    if (downloadUrl) {
      // Create a temporary anchor to download the file
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "resume-package.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started!");
    } else {
      toast.info("Download URL not available yet. Please wait for generation to complete.");
    }
  };

  // Calculate filled sections count - only count sections with meaningful data
  const getFilledSectionsCount = (): number => {
    if (!currentResume) return 0;
    let count = 0;
    
    // Basic info (contact_info) - need at least name OR email
    if (currentResume.contact_info && (
      (currentResume.contact_info.name && currentResume.contact_info.name.trim()) ||
      (currentResume.contact_info.email && currentResume.contact_info.email.trim())
    )) {
      count++;
    }
    
    // Summary - need actual content, not just empty string or just "Resume" title
    if (currentResume.summary && currentResume.summary.trim() && currentResume.summary.trim() !== "Resume") {
      count++;
    }
    
    // Experience - need at least one with company and role
    if (currentResume.work_experiences && currentResume.work_experiences.length > 0) {
      const hasValidExp = currentResume.work_experiences.some(
        (exp: any) => exp.company && exp.company.trim() && exp.role && exp.role.trim()
      );
      if (hasValidExp) count++;
    }
    
    // Education - need at least one with institution and degree
    if (currentResume.educations && currentResume.educations.length > 0) {
      const hasValidEdu = currentResume.educations.some(
        (edu: any) => edu.institution && edu.institution.trim() && edu.degree && edu.degree.trim()
      );
      if (hasValidEdu) count++;
    }
    
    // Skills - need at least one skill with a name
    if (currentResume.skills && currentResume.skills.length > 0) {
      const hasValidSkill = currentResume.skills.some(
        (skill: any) => skill.name && skill.name.trim()
      );
      if (hasValidSkill) count++;
    }
    
    // Projects - need at least one with title
    if (currentResume.projects && currentResume.projects.length > 0) {
      const hasValidProject = currentResume.projects.some(
        (proj: any) => proj.title && proj.title.trim()
      );
      if (hasValidProject) count++;
    }
    
    // Certifications - need at least one with name
    if (currentResume.certifications && currentResume.certifications.length > 0) {
      const hasValidCert = currentResume.certifications.some(
        (cert: any) => cert.name && cert.name.trim()
      );
      if (hasValidCert) count++;
    }
    
    return count;
  };

  const filledSectionsCount = getFilledSectionsCount();

  return (
    <div className="w-full bg-white">
      {/* Hero */}
      <section className="w-full">
        <div className="relative flex min-h-[420px] w-full flex-col items-center justify-center gap-6 rounded-b-2xl bg-emerald-500 px-4 py-16 md:min-h-[400px] md:gap-8 md:py-20">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-between overflow-visible px-4 md:px-12 lg:px-16">
            <div className="hidden md:block">
              <CareersFloatingCardA />
            </div>
            <div className="hidden md:block">
              <CareersFloatingCardB />
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-6 text-center md:gap-8">
            <div className="rounded-full bg-white/20 px-4 py-2 shadow-sm">
              <span className="font-['Satoshi'] text-sm font-normal leading-5 text-white">
                AI-Powered Resume Builder
              </span>
            </div>
            <h1 className="max-w-xl font-['Clash_Display'] text-3xl font-medium leading-tight tracking-tight text-white md:text-4xl lg:text-5xl">
              Build Your Professional Resume
            </h1>
            <p className="max-w-2xl font-['Satoshi'] text-sm font-normal leading-6 text-white/90 md:text-base md:leading-7">
              Create a professional, ATS-friendly resume in minutes. Our AI helps you highlight your
              skills and experience in the best possible way.
            </p>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="w-full bg-white">
        <div className="mx-auto max-w-[var(--section-max-width)] px-4 py-10 md:px-8 md:py-12">
          {view === "optimizing" && (
            <div className="flex flex-col items-center gap-12">
              <div className="flex w-full max-w-3xl flex-col items-center gap-12 rounded-2xl bg-white py-12 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] outline outline-2 outline-offset-[-2px] outline-black">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
                    <svg
                      className="h-14 w-14 text-emerald-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-center font-['Clash_Display'] text-2xl font-medium leading-8 tracking-tight text-neutral-950 md:text-3xl">
                    Optimizing Your Resume
                  </h2>
                  <p className="text-center font-['Satoshi'] text-base font-normal leading-6 text-gray-600">
                    Our AI is analyzing and enhancing your resume for maximum impact...
                  </p>
                </div>
                <ul className="flex flex-col gap-3" role="list">
                  {[
                    "Analyzing content structure",
                    "Optimizing for ATS systems",
                    "Enhancing formatting",
                    "Finalizing improvements",
                  ].map((step, i) => (
                    <li key={step} className="flex items-center gap-3">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                        style={{ opacity: 1 - i * 0.05 }}
                      />
                      <span className="font-['Satoshi'] text-sm font-normal leading-5 text-gray-600">
                        {step}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {view === "optimized" && (
            <div className="flex flex-col gap-12">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-6 rounded-2xl bg-white py-8 pl-8 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] outline outline-2 outline-offset-[-2px] outline-black md:flex-row md:items-center md:justify-between md:pr-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                      <svg
                        className="h-5 w-5 text-emerald-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="font-['Clash_Display'] text-2xl font-normal leading-8 tracking-tight text-neutral-950">
                        Resume Optimized!
                      </h2>
                      <p className="font-['Satoshi'] text-sm font-normal leading-5 text-gray-600">
                        Your resume has been enhanced and is ready to download
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!downloadUrl}
                    className="flex h-9 w-32 items-center justify-center gap-2 rounded-2xl bg-emerald-500 font-['Satoshi'] text-sm font-medium leading-5 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiDownload className="h-4 w-4" />
                    Download
                  </button>
                </div>
                <div className="flex flex-col gap-4 md:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setView("default");
                      setOptimizedResume(null);
                      setDownloadUrl(null);
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-2 outline outline-2 outline-black font-['Satoshi'] text-sm font-medium leading-5 text-neutral-950"
                  >
                    <FiUpload className="h-4 w-4" />
                    Start Over
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!downloadUrl}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-2 font-['Satoshi'] text-sm font-medium leading-5 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiDownload className="h-4 w-4" />
                    Download Resume
                  </button>
                </div>
              </div>
              <div className="flex justify-center">
                <CareersFeatureCards />
              </div>
            </div>
          )}

          {view === "default" && (
            <>
              <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-11">
                {/* Edit Resume */}
                <div className="flex max-w-[804px] flex-1 flex-col gap-6">
                  <div className="flex flex-col gap-6 rounded-2xl bg-white py-8 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] outline outline-2 outline-offset-[-2px] outline-black md:gap-12">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center md:justify-between md:px-8">
                      <h2 className="font-['Satoshi'] text-xl font-normal leading-8 tracking-tight text-neutral-950 md:text-2xl">
                        Edit Resume
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className="font-['Satoshi'] text-xs font-normal uppercase leading-4 tracking-tight text-gray-500">
                          Resume Data
                        </span>
                        {currentResume ? (
                          <span className="rounded bg-green-50 px-2 py-1 font-['Satoshi'] text-xs font-normal leading-4 text-emerald-500 outline outline-1 outline-green-200">
                            {filledSectionsCount} {filledSectionsCount === 1 ? "SECTION" : "SECTIONS"} FILLED
                          </span>
                        ) : (
                          <span className="rounded bg-gray-50 px-2 py-1 font-['Satoshi'] text-xs font-normal leading-4 text-gray-500 outline outline-1 outline-gray-200">
                            NO RESUME LOADED
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="px-4 md:px-8">
                      <CareersEditorSections
                        expandedSections={expandedSections}
                        toggleSection={toggleSection}
                        resume={currentResume || {}}
                        onResumeChange={(updated) => setCurrentResume(updated)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => setImportModalOpen(true)}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white outline outline-2 outline-black font-['Satoshi'] text-sm font-medium leading-5 text-neutral-950"
                    >
                      <FiUpload className="h-4 w-4" />
                      {currentResume ? "Load Different Resume" : "Import Resume"}
                    </button>
                    {currentResume && (
                      <button
                        type="button"
                        onClick={handleSaveResume}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 font-['Satoshi'] text-sm font-medium leading-5 text-white"
                      >
                        <FiSave className="h-4 w-4" />
                        Save Resume
                      </button>
                    )}
                  </div>
                </div>

                {/* Tools */}
                <div className="w-full shrink-0 md:w-96">
                  <div className="flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] outline outline-2 outline-offset-[-2px] outline-black">
                    <h2 className="font-['Satoshi'] text-lg font-bold leading-7 text-neutral-950">
                      Tools
                    </h2>

                    {/* Job Optimizer - desktop */}
                    <div className="hidden flex-col gap-2 rounded-2xl bg-gray-50 p-4 outline outline-2 outline-gray-200 md:flex">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg
                            className="h-4 w-4 text-emerald-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span className="font-['Clash_Display'] text-sm font-medium leading-5 text-neutral-950">
                            Job Optimizer
                          </span>
                        </div>
                        <JobOptimizerToggle
                          checked={jobOptimizerOn}
                          onToggle={() => setJobOptimizerOn((o) => !o)}
                          variant="desktop"
                        />
                      </div>
                      <p className="font-['Satoshi'] text-xs font-normal leading-4 text-gray-500">
                        Update resume for specific job
                      </p>
                    </div>

                    {/* AI Optimize - mobile */}
                    <div className="flex flex-col gap-3 md:hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg
                            className="h-5 w-5 text-emerald-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span className="font-['Satoshi'] text-sm font-medium leading-5 text-neutral-950">
                            AI Optimize
                          </span>
                        </div>
                        <JobOptimizerToggle
                          checked={jobOptimizerOn}
                          onToggle={() => setJobOptimizerOn((o) => !o)}
                          variant="mobile"
                        />
                      </div>
                      <p className="font-['Satoshi'] text-xs font-normal leading-4 text-gray-500">
                        Boost ATS score by 40%+
                      </p>
                    </div>

                    {/* Desktop form fields */}
                    <div className="hidden flex-col gap-4 md:flex">
                      <div className="flex flex-col gap-2">
                        <label className="font-['Satoshi'] text-xs font-medium uppercase leading-4 tracking-tight text-gray-600">
                          Target Role
                        </label>
                        <input
                          type="text"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          placeholder="e.g. Senior Software Engineer"
                          className="h-9 rounded-lg border-2 border-gray-200 bg-white px-3 py-1 font-['Satoshi'] text-sm font-normal text-neutral-950 placeholder:text-gray-500"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-['Satoshi'] text-xs font-medium uppercase leading-4 tracking-tight text-gray-600">
                          Target Company
                        </label>
                        <input
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="e.g. Google"
                          className="h-9 rounded-lg border-2 border-gray-200 bg-white px-3 py-1 font-['Satoshi'] text-sm font-normal text-neutral-950 placeholder:text-gray-500"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-['Satoshi'] text-xs font-medium uppercase leading-4 tracking-tight text-gray-600">
                          Job Description
                        </label>
                        <textarea
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          placeholder="Paste the job description here..."
                          rows={5}
                          className="resize-none rounded-lg border-2 border-gray-200 bg-white px-3 py-2 font-['Satoshi'] text-sm font-normal leading-5 text-neutral-950 placeholder:text-gray-500"
                        />
                      </div>
                    </div>

                    {/* Mobile form fields */}
                    <div className="flex flex-col gap-4 md:hidden">
                      <div className="flex flex-col gap-3">
                        <label className="font-['Satoshi'] text-xs font-normal uppercase leading-4 tracking-tight text-gray-500">
                          INSERT TOOLS
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Name, Software Engineer"
                          className="h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 pt-3 pb-0.5 font-['Satoshi'] text-xs font-normal leading-4 text-neutral-950 placeholder:text-neutral-950"
                        />
                      </div>
                      <div className="flex flex-col gap-3">
                        <label className="font-['Satoshi'] text-xs font-normal uppercase leading-4 tracking-tight text-gray-500">
                          INSERT LOCATION
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Orange"
                          className="h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 pt-3 pb-0.5 font-['Satoshi'] text-xs font-normal leading-4 text-neutral-950 placeholder:text-neutral-950"
                        />
                      </div>
                      <div className="flex flex-col gap-3">
                        <label className="font-['Satoshi'] text-xs font-normal uppercase leading-4 tracking-tight text-gray-500">
                          JOB DESCRIPTION
                        </label>
                        <input
                          type="text"
                          placeholder="Paste job description here..."
                          className="h-11 rounded-lg border border-gray-200 bg-gray-50 px-3 pt-3 pb-0.5 font-['Satoshi'] text-xs font-normal leading-4 text-neutral-950 placeholder:text-neutral-950"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateOrOptimize}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 font-['Clash_Display'] text-base font-medium leading-5 text-white shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] outline outline-2 outline-offset-[-2px] outline-neutral-900 md:h-11"
                    >
                      <svg
                        className="h-5 w-5 md:hidden"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      <span className="font-['Satoshi'] text-sm font-medium leading-5 md:font-['Clash_Display'] md:text-base">
                        Optimize Resume
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Generate Resume CTA */}
              <div className="flex w-full justify-center py-4 md:py-6">
                <button
                  type="button"
                  onClick={handleGenerateOrOptimize}
                  className="flex w-full max-w-3xl items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 font-['Clash_Display'] text-2xl font-medium leading-6 text-white outline outline-2 outline-offset-[-2px] outline-neutral-900 md:py-6"
                >
                  <svg
                    className="h-5 w-5 md:hidden"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  Generate Resume
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      <ImportResumeModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImport}
      />
    </div>
  );
}
