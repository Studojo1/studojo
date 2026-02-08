const API_BASE = import.meta.env.VITE_CONTROL_PLANE_URL || "https://api.studojo.com";

export interface ServiceStatus {
  name: string;
  status: string;
  version: string;
  replicas: number;
  ready_replicas: number;
  last_deployment: string;
}

export interface Deployment {
  service: string;
  version: string;
  deployed_at: string;
  deployed_by: string;
  status: string;
  workflow_run?: number;
}

export async function getServices(): Promise<ServiceStatus[]> {
  const response = await fetch(`${API_BASE}/v1/dev/services`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch services");
  const data = await response.json();
  return data.services;
}

export async function queryLogs(service?: string, query?: string, limit = 100) {
  const params = new URLSearchParams();
  if (service) params.set("service", service);
  if (query) params.set("query", query);
  params.set("limit", limit.toString());
  
  const response = await fetch(`${API_BASE}/v1/dev/logs?${params}`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch logs");
  return response.json();
}

export async function queryMetrics(service?: string, metric?: string, start?: string, end?: string) {
  const params = new URLSearchParams();
  if (service) params.set("service", service);
  if (metric) params.set("metric", metric);
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  
  const response = await fetch(`${API_BASE}/v1/dev/metrics?${params}`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch metrics");
  return response.json();
}

export async function getCICDStatus(service?: string) {
  const params = new URLSearchParams();
  if (service) params.set("service", service);
  
  const response = await fetch(`${API_BASE}/v1/dev/ci-cd/status?${params}`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch CI/CD status");
  return response.json();
}

export async function getDeployments(service?: string): Promise<Deployment[]> {
  const params = new URLSearchParams();
  if (service) params.set("service", service);
  
  const response = await fetch(`${API_BASE}/v1/dev/deployments?${params}`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch deployments");
  const data = await response.json();
  return data.deployments;
}

