// Thin wrapper around the existing FastAPI backend (see docs/API.md).
// Uses the same API base URL and localStorage token as the dashboard page.

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
export const API_URL = configuredApiUrl.replace(/\/+$/, "").replace(/\/api$/, "");

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

/** Turns FastAPI error bodies ({detail: string} or 422 {detail: [{loc, msg}]}) into readable text. */
function readDetail(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map(d => {
          const item = d as { loc?: unknown[]; msg?: string };
          const field = Array.isArray(item.loc) ? item.loc.filter(p => p !== "body").join(".") : "";
          return field ? `${field}: ${item.msg}` : item.msg;
        })
        .join("; ");
    }
  }
  return fallback;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(0, `Could not reach the API at ${API_URL}. Check that the FastAPI server is running.`);
  }
  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.dispatchEvent(new CustomEvent("auth-expired"));
    }
    const fallback = response.status === 401 ? "You are not signed in, or your session has expired." : `Request failed with status ${response.status}.`;
    throw new ApiError(response.status, readDetail(body, fallback));
  }
  return body as T;
}
