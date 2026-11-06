import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import heroImage from "../../assets/solar-hero.svg";

const CLOSE_BUTTON_CLASSES =
  "absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-ink-900 backdrop-blur-sm transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400";

interface LeadPopupModalProps {
  /** Rendered (already gated by the caller's state) when true. */
  open: boolean;
  /** Invoked by backdrop clicks, the close button, and the Escape key. */
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Reusable modal wrapper that shows its children side by side with a solar
 * installation image (compact banner on mobile, left half on desktop).
 * Purely presentational: it owns overlay behaviour (backdrop, Escape,
 * scroll lock, focus) and renders whatever form it is given as children.
 *
 * The panel is capped at the viewport height so it always fits on screen;
 * the form area scrolls internally when a request variant adds fields.
 */
export function LeadPopupModal({
  open,
  onClose,
  title,
  description,
  children,
}: LeadPopupModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  // Escape closes the popup while it is open.
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Lock background scrolling and move focus into the dialog while open.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90]">
      {/* Backdrop — clicking it dismisses the popup. */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-forest-950/70 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="pointer-events-none absolute inset-0 flex items-end justify-center p-4 sm:items-center sm:p-6"
      >
        <div className="pointer-events-auto relative flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:flex-row">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close quote request popup"
            className={CLOSE_BUTTON_CLASSES}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="h-5 w-5"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          {/* Solar installation visual — full-height panel image on desktop,
              slim top banner on mobile. */}
          <div className="relative h-24 shrink-0 sm:h-auto sm:w-2/5">
            <img
              src={heroImage}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover object-[center_38%]"
            />
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="pr-14 pl-6 pt-6 sm:pl-8 sm:pt-8">
              <h2 id={titleId} className="text-xl font-bold text-ink-900">
                {title}
              </h2>
              {description && (
                <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                  {description}
                </p>
              )}
            </div>

            {/* The only scrollable region, inside the fixed-height panel. */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-4 sm:px-6 sm:pb-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
