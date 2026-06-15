const API_URL = import.meta.env.VITE_API_URL ?? "/api";

async function api<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...init.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? "Request failed");
  }
  return data as T;
}

export const authApi = {
  me: () => api<{ user: import("./types").User }>("/auth/me"),
  login: (id: string, pin: string) =>
    api<{ user: import("./types").User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ id, pin }),
    }),
  register: (body: {
    name: string;
    pin: string;
    vendorType: "retail" | "food" | "format_b";
    restockFrequency?: string;
    sellingDaysPerWeek?: number;
  }) =>
    api<{ user: import("./types").User; pin: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  logout: () => api<{ ok: boolean }>("/auth/logout", { method: "POST" }),
};

export const jobsApi = {
  create: (form: FormData) =>
    api<{ jobId: string }>("/jobs", { method: "POST", body: form }),
  status: (jobId: string) =>
    api<{ status: string; error?: string }>(`/jobs/${jobId}/status`),
  ocr: (jobId: string) =>
    api<{
      status: string;
      ocrResult: import("./types").OcrResult;
      correctedOcr: import("./types").OcrResult;
      weekStart: string;
      uploadMeta: Record<string, unknown>;
      quality?: { warning?: string };
    }>(`/jobs/${jobId}/ocr`),
  saveOcr: (jobId: string, correctedOcr: import("./types").OcrResult) =>
    api<{ ok: boolean }>(`/jobs/${jobId}/ocr`, {
      method: "PATCH",
      body: JSON.stringify({ correctedOcr }),
    }),
  confirm: (jobId: string) =>
    api<{ ok: boolean; status: string }>(`/jobs/${jobId}/confirm`, {
      method: "POST",
    }),
  recheck: (jobId: string, flagged: string[], correctedOcr: import("./types").OcrResult) =>
    api<{
      ok: boolean;
      correctedOcr: import("./types").OcrResult;
      quality: { warning?: string };
    }>(`/jobs/${jobId}/recheck`, {
      method: "POST",
      body: JSON.stringify({ flagged, correctedOcr }),
    }),
};

export const reportsApi = {
  dashboard: () => api<import("./types").DashboardPayload>("/reports/dashboard"),
  weekDashboard: (weekStart: string) =>
    api<import("./types").DashboardPayload>(`/reports/${weekStart}/dashboard`),
  latest: () =>
    api<{ report: import("./types").ReportJson | null; weekStart?: string }>(
      "/reports/latest",
    ),
  history: () =>
    api<{ weeks: import("./types").WeekSummary[] }>("/reports/history"),
  byWeek: (weekStart: string) =>
    api<{ report: import("./types").ReportJson; weekStart: string }>(
      `/reports/${weekStart}`,
    ),
  ocrByWeek: (weekStart: string) =>
    api<{ ocr: import("./types").OcrResult; weekStart: string }>(
      `/reports/${weekStart}/ocr`,
    ),
  delete: (weekStart: string) =>
    api<{ ok: boolean }>(`/reports/${weekStart}`, { method: "DELETE" }),
};

export const askApi = {
  ask: (question: string) =>
    api<{ answer: string }>("/ask", {
      method: "POST",
      body: JSON.stringify({ question }),
    }),
};
