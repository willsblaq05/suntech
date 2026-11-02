/**
 * React context shared between AdminAuthProvider.tsx (the component) and
 * useAdminAuth.ts (the hook). Kept separate so fast refresh works cleanly.
 */

import { createContext } from "react";

import { setApiToken, setSessionExpiredHandler } from "../api/session";

type AdminSession = { kind: "jwt"; token: string } | { kind: "demo" };

export type AdminAuthStatus = "signed-in" | "demo" | "signed-out";

export interface AdminAuthValue {
  status: AdminAuthStatus;
  isDemo: boolean;
  username: string | null;
  signIn(username: string, password: string): Promise<void>;
  startDemo(): void;
  signOut(): void;
}

export const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export const STORAGE_KEY = "suntech.admin.session";

export type { AdminSession };

/** Let the transport layer read the token and react to 401s. */
export function syncTransport(session: AdminSession | null): void {
  setApiToken(session?.kind === "jwt" ? session.token : null);
}

/** Forward API-level session expiry into provider state. */
export function registerSessionExpiredHandler(
  onExpired: () => void,
): () => void {
  setSessionExpiredHandler(onExpired);
  return () => setSessionExpiredHandler(null);
}
