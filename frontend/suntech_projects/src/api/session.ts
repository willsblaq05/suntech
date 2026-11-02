/**
 * Shared transport for every admin API call.
 *
 * - Resolves the API base URL the same way the public QuoteForm does
 *   (VITE_API_URL, falling back to same-origin; the Vite dev server
 *   proxies /api to the backend).
 * - Holds the in-memory bearer token (never localStorage) and attaches it.
 * - Reports 401s centrally so an expired JWT drops the operator back to
 *   the login screen instead of leaving a blank dashboard.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") ?? "";

let currentToken: string | null = null;
let onSessionExpired: (() => void) | null = null;

export function setApiToken(token: string | null): void {
  currentToken = token;
}

/** Registered by AdminAuthProvider so 401s can clear the session. */
export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

export class ApiError extends Error {
  /** 0 = network-level failure (API unreachable). */
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function adminFetch(path: string, init?: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...(init?.headers as Record<string, string> | undefined),
        ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
      },
    });
  } catch {
    throw new ApiError(
      0,
      "Could not reach the SUNTECH API. Check your connection and try again.",
    );
  }

  if (response.status === 401 && currentToken) {
    onSessionExpired?.();
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }

  return response;
}

/** Extracts the human-readable "detail" field FastAPI error responses carry. */
export async function readErrorDetail(response: Response): Promise<string | null> {
  try {
    const body = (await response.json()) as { detail?: unknown } | null;
    if (typeof body?.detail === "string") return body.detail;
  } catch {
    // Body was not JSON — fall through.
  }
  return null;
}
