/** Typed accessor for the admin auth context. */

import { useContext } from "react";

import { AdminAuthContext } from "./adminAuthContext";
import type { AdminAuthValue } from "./adminAuthContext";

export function useAdminAuth(): AdminAuthValue {
  const context = useContext(AdminAuthContext);
  if (context === null) {
    throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  }
  return context;
}
