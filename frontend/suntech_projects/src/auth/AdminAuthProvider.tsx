/**
 * Session state for the admin portal.
 *
 * - The JWT lives in memory + sessionStorage only (30-minute expiry comes
 *   from the backend). Passwords are never stored or seen by the client.
 * - "demo" sessions let the dashboard be previewed with clearly-labelled
 *   sample data when the backend is unreachable. Demo sessions never make
 *   authenticated API calls.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { requestAdminToken, } from "../api/authAdmin";
import {
  AdminAuthContext,
  STORAGE_KEY,
  registerSessionExpiredHandler,
  syncTransport,
} from "./adminAuthContext";
import type { AdminSession } from "./adminAuthContext";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function tokenExpiresAt(token: string): number | null {
  const exp = decodeJwtPayload(token)?.exp;
  return typeof exp === "number" ? exp * 1000 : null;
}

function readStoredSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminSession;
    if (parsed.kind === "demo") return parsed;
    if (
      parsed.kind === "jwt" &&
      typeof parsed.token === "string" &&
      parsed.token.split(".").length === 3
    ) {
      const expiresAt = tokenExpiresAt(parsed.token);
      if (expiresAt === null || expiresAt > Date.now()) return parsed;
    }
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  return null;
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(readStoredSession);

  const status: "signed-in" | "demo" | "signed-out" =
    session === null ? "signed-out" : session.kind === "demo" ? "demo" : "signed-in";

  // Keep the transport layer in sync with the session.
  useEffect(() => syncTransport(session), [session]);

  // Any 401 on an authenticated call drops the operator back to sign-in.
  useEffect(
    () =>
      registerSessionExpiredHandler(() => {
        setSession(null);
        sessionStorage.removeItem(STORAGE_KEY);
      }),
    [],
  );

  const persist = useCallback((next: AdminSession | null) => {
    setSession(next);
    if (next) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const signIn = useCallback(
    async (username: string, password: string) => {
      const token = await requestAdminToken(username, password);
      persist({ kind: "jwt", token });
    },
    [persist],
  );

  const startDemo = useCallback(() => persist({ kind: "demo" }), [persist]);
  const signOut = useCallback(() => persist(null), [persist]);

  const username = useMemo(() => {
    if (session?.kind !== "jwt") return null;
    const subject = decodeJwtPayload(session.token)?.sub;
    return typeof subject === "string" ? subject : null;
  }, [session]);

  const value = useMemo(
    () => ({
      status,
      isDemo: status === "demo",
      username,
      signIn,
      startDemo,
      signOut,
    }),
    [status, username, signIn, startDemo, signOut],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
