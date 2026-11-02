/**
 * Admin authentication against the existing backend endpoint:
 *   POST /api/v1/auth/token  (OAuth2 password form — username + password)
 *
 * The backend has no email-based login and no registration; it exchanges
 * the configured ADMIN_USERNAME / ADMIN_PASSWORD for a 30-minute JWT.
 */

import { adminFetch, ApiError, readErrorDetail } from "./session";

export type AuthFailureKind = "invalid" | "locked" | "network" | "server";

export class AdminLoginError extends Error {
  readonly kind: AuthFailureKind;

  constructor(kind: AuthFailureKind, message: string) {
    super(message);
    this.name = "AdminLoginError";
    this.kind = kind;
  }
}

export async function requestAdminToken(
  username: string,
  password: string,
): Promise<string> {
  let response: Response;
  try {
    response = await adminFetch("/api/v1/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username, password }).toString(),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 0) {
      throw new AdminLoginError(
        "network",
        "Could not reach the SUNTECH service. Please check your connection and try again.",
      );
    }
    throw error;
  }

  if (response.status === 401) {
    const detail = (await readErrorDetail(response)) ?? "";
    if (detail.includes("not configured")) {
      throw new AdminLoginError(
        "locked",
        "The admin account is not configured yet. Set ADMIN_PASSWORD on the server to enable sign-in.",
      );
    }
    throw new AdminLoginError("invalid", "Incorrect username or password.");
  }

  if (!response.ok) {
    throw new AdminLoginError(
      "server",
      "Sign-in failed on the server. Please try again shortly.",
    );
  }

  const body = (await response.json().catch(() => null)) as
    | { access_token?: string }
    | null;
  const token = body?.access_token;
  if (!token) {
    throw new AdminLoginError(
      "server",
      "Sign-in failed on the server. Please try again shortly.",
    );
  }
  return token;
}
