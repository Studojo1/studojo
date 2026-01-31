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

/** Assignment-gen v1 minimal payload. */
export interface SubmitPayload {
  assignment_type: string;
  description: string;
  length_words: number;
  format_style: string;
  allow_web_search: boolean;
  humanizer_config?: { enabled: boolean; intensity: string };
}

/** POST /v1/jobs response (202 new, 200 replay). */
export interface SubmitResponse {
  job_id: string;
  status: string;
  created_at: string;
  result?: { download_url?: string; [k: string]: unknown };
}

/** GET /v1/jobs/:id response. */
export interface JobResponse {
  job_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  result?: { download_url?: string; [k: string]: unknown };
  error?: string;
}

/** Control plane API error body. */
export interface ApiError {
  error?: { code?: string; message?: string };
}

export class ControlPlaneError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: ApiError
  ) {
    super(message);
    this.name = "ControlPlaneError";
  }
}

export interface OutlineResponse {
  job_id: string;
  status: string;
  outline?: any;
}

export interface OutlineEditResponse {
  job_id: string;
  status: string;
  outline?: any;
  assistant_message?: string;
}

/** Resume generation payload. */
export interface ResumeGenPayload {
  resume: any; // Resume JSON object matching services-jobs resume model
  job_title?: string;
  company?: string;
  job_description?: string;
}

/** Resume optimization payload. */
export interface ResumeOptimizePayload {
  resume: any; // Resume JSON object
  job_title: string;
  company: string;
  job_description: string;
}

/** Generate outline from assignment description (free, no payment). */
export async function generateOutline(
  payload: SubmitPayload
): Promise<OutlineResponse> {
  const token = await getToken();
  if (!token) throw new ControlPlaneError("No token", 401);

  const base = getControlPlaneUrl();
  const res = await fetch(`${base}/v1/outlines/generate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "assignment-gen",
      payload,
    }),
  });

  const data = (await res.json()) as OutlineResponse | ApiError;
  if (!res.ok) {
    const err = data as ApiError;
    throw new ControlPlaneError(
      err?.error?.message ?? "Outline generation failed",
      res.status,
      err
    );
  }
  return data as OutlineResponse;
}

/** Edit outline via chat message (free, no payment). */
export async function editOutline(
  outline: any,
  userMessage: string
): Promise<OutlineEditResponse> {
  const token = await getToken();
  if (!token) throw new ControlPlaneError("No token", 401);

  const base = getControlPlaneUrl();
  const res = await fetch(`${base}/v1/outlines/edit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      outline,
      user_message: userMessage,
    }),
  });

  const data = (await res.json()) as OutlineEditResponse | ApiError;
  if (!res.ok) {
    const err = data as ApiError;
    throw new ControlPlaneError(
      err?.error?.message ?? "Outline editing failed",
      res.status,
      err
    );
  }
  return data as OutlineEditResponse;
}

export async function submitJob(
  payload: SubmitPayload,
  paymentOrderId: string,
  outline?: any
): Promise<{
  res: SubmitResponse;
  status: number;
}> {
  const token = await getToken();
  if (!token) throw new ControlPlaneError("No token", 401);

  const base = getControlPlaneUrl();
  const body: any = {
    type: "assignment-gen",
    payload,
    payment_order_id: paymentOrderId,
  };
  if (outline) {
    body.outline = outline;
  }

  const res = await fetch(`${base}/v1/jobs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as SubmitResponse | ApiError;
  if (!res.ok) {
    const err = data as ApiError;
    throw new ControlPlaneError(
      err?.error?.message ?? "Submit failed",
      res.status,
      err
    );
  }
  return { res: data as SubmitResponse, status: res.status };
}

export async function getJob(jobId: string): Promise<JobResponse> {
  console.log(`[getJob] Fetching job ${jobId}`);
  const token = await getToken();
  if (!token) throw new ControlPlaneError("No token", 401);

  const base = getControlPlaneUrl();
  const res = await fetch(`${base}/v1/jobs/${encodeURIComponent(jobId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = (await res.json()) as JobResponse | ApiError;
  if (!res.ok) {
    const err = data as ApiError;
    throw new ControlPlaneError(
      err?.error?.message ?? "Get job failed",
      res.status,
      err
    );
  }
  const job = data as JobResponse;
  console.log(`[getJob] Job ${jobId} response:`, {
    status: job.status,
    hasResult: !!job.result,
    resultType: typeof job.result,
    resultKeys: job.result && typeof job.result === "object" ? Object.keys(job.result) : null,
    resultPreview: job.result ? JSON.stringify(job.result).substring(0, 200) : null,
  });
  return job;
}

/** List jobs for the current user. */
export async function getJobs(
  jobType?: string,
  limit?: number,
  offset?: number
): Promise<JobResponse[]> {
  const token = await getToken();
  if (!token) throw new ControlPlaneError("No token", 401);

  const base = getControlPlaneUrl();
  const params = new URLSearchParams();
  if (jobType) params.append("type", jobType);
  if (limit !== undefined) params.append("limit", limit.toString());
  if (offset !== undefined) params.append("offset", offset.toString());

  const url = `${base}/v1/jobs${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = (await res.json()) as JobResponse[] | ApiError;
  if (!res.ok) {
    const err = data as ApiError;
    throw new ControlPlaneError(
      err?.error?.message ?? "List jobs failed",
      res.status,
      err
    );
  }
  return data as JobResponse[];
}

/** Submit resume generation job. */
export async function submitResumeJob(
  payload: ResumeGenPayload
): Promise<{
  res: SubmitResponse;
  status: number;
}> {
  const token = await getToken();
  if (!token) throw new ControlPlaneError("No token", 401);

  const base = getControlPlaneUrl();
  const res = await fetch(`${base}/v1/jobs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "resume-gen",
      payload,
    }),
  });

  const data = (await res.json()) as SubmitResponse | ApiError;
  if (!res.ok) {
    const err = data as ApiError;
    throw new ControlPlaneError(
      err?.error?.message ?? "Resume generation failed",
      res.status,
      err
    );
  }
  return { res: data as SubmitResponse, status: res.status };
}

/** Submit resume optimization job. */
export async function optimizeResumeJob(
  payload: ResumeOptimizePayload
): Promise<{
  res: SubmitResponse;
  status: number;
}> {
  const token = await getToken();
  if (!token) throw new ControlPlaneError("No token", 401);

  const base = getControlPlaneUrl();
  const res = await fetch(`${base}/v1/jobs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "resume-optimize",
      payload,
    }),
  });

  const data = (await res.json()) as SubmitResponse | ApiError;
  if (!res.ok) {
    const err = data as ApiError;
    throw new ControlPlaneError(
      err?.error?.message ?? "Resume optimization failed",
      res.status,
      err
    );
  }
  return { res: data as SubmitResponse, status: res.status };
}
