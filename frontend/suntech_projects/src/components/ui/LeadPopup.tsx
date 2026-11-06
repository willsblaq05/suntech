import { useCallback, useEffect, useState } from "react";
import { QuoteForm } from "../sections/QuoteForm";
import { LeadPopupModal } from "./LeadPopupModal";

const STORAGE_KEY = "suntech:lead-popup-state";
const AUTO_OPEN_DELAY_MS = 10_000;

type StoredState = "dismissed" | "submitted";

function getStoredState(): StoredState | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "dismissed" || value === "submitted" ? value : null;
  } catch {
    // Storage may be unavailable (e.g. private browsing); show the popup.
    return null;
  }
}

function storeState(state: StoredState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, state);
  } catch {
    // Non-fatal: without storage the popup simply reappears next visit.
  }
}

/**
 * Auto-opens the existing QuoteForm 10 seconds after a visitor lands on the
 * homepage. The form is reused as-is — no duplicate submission logic. A
 * dismissal or a successful lead submission is remembered in localStorage so
 * the popup does not reappear on later visits. Rendered once, on the public
 * homepage only.
 */
export function LeadPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (getStoredState()) return;
    const timer = window.setTimeout(() => setOpen(true), AUTO_OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const dismiss = useCallback(() => {
    storeState("dismissed");
    setOpen(false);
  }, []);

  const handleSubmitted = useCallback(() => storeState("submitted"), []);

  return (
    <LeadPopupModal
      open={open}
      onClose={dismiss}
      title="Request your free solar quote"
      description="Tell us what you need and we will connect you with a suitable installation provider."
    >
      <QuoteForm onSubmitted={handleSubmitted} />
    </LeadPopupModal>
  );
}
