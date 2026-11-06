/**
 * Persistent sidebar shell for the admin portal (dark forest green, gold
 * active state). Becomes an overlay drawer on mobile via AdminHeader.
 */

import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";

import { Wordmark } from "../ui/Wordmark";

const NAV_ITEMS = [
  {
    to: "/admin/dashboard",
    label: "Dashboard",
    icon: (
      // bar chart
      <>
        <path d="M3 3v18h18" />
        <path d="M8 17v-6M13 17V7M18 17v-3" />
      </>
    ),
  },
  {
    to: "/admin/inquiries",
    label: "Inquiries",
    icon: (
      // inbox
      <>
        <path d="M4 13h4l2 3h4l2-3h4" />
        <path d="M20 13V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2z" />
      </>
    ),
  },
  {
    to: "/admin/testimonials",
    label: "Testimonials",
    icon: (
      // speech bubble
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    ),
  },
] as const;

interface AdminSidebarProps {
  /** Mobile drawer state; ignored on desktop. */
  open: boolean;
  onClose: () => void;
  onSignOut: () => void;
  isDemo: boolean;
}

export function AdminSidebar({ open, onClose, onSignOut, isDemo }: AdminSidebarProps) {
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const confirmTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (confirmTimer.current !== null) window.clearTimeout(confirmTimer.current);
  }, []);

  function requestSignOut() {
    if (confirmingSignOut) {
      onSignOut();
      return;
    }
    setConfirmingSignOut(true);
    confirmTimer.current = window.setTimeout(() => {
      setConfirmingSignOut(false);
      confirmTimer.current = null;
    }, 3500);
  }

  const body = (
    <div className="flex h-full flex-col bg-forest-950 text-white">
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
        <NavLink to="/admin/dashboard" aria-label="SUNTECH PROJECTS admin dashboard" onClick={onClose}>
          <Wordmark tone="dark" />
        </NavLink>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 lg:hidden"
          aria-label="Close navigation"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="h-5 w-5">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-6" aria-label="Admin">
        <p className="px-2 pb-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/40">
          Manage
        </p>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-forest-800 text-gold-300"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="h-4.5 w-4.5 h-[1.15rem] w-[1.15rem]"
            >
              {item.icon}
            </svg>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        {isDemo && (
          <p className="mx-2 mb-3 rounded-lg bg-gold-300/15 px-3 py-2 text-xs font-semibold text-gold-300">
            Demo preview — sample data
          </p>
        )}
        {confirmingSignOut ? (
          <div className="mx-2 rounded-lg border border-white/15 bg-white/5 p-3">
            <p className="text-xs text-white/70">Sign out of the admin portal?</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={onSignOut}
                className="flex-1 rounded-md bg-gold-300 px-3 py-1.5 text-xs font-bold text-forest-950 transition-colors hover:bg-gold-400"
              >
                Sign out
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmTimer.current !== null) {
                    window.clearTimeout(confirmTimer.current);
                    confirmTimer.current = null;
                  }
                  setConfirmingSignOut(false);
                }}
                className="flex-1 rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={requestSignOut}
            className="mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="h-[1.15rem] w-[1.15rem]"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5M21 12H9" />
            </svg>
            Sign out
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{body}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <button
            type="button"
            aria-label="Close navigation overlay"
            onClick={onClose}
            className="absolute inset-0 bg-forest-950/60"
          />
          <div className="absolute inset-y-0 left-0 w-72 shadow-2xl">{body}</div>
        </div>
      )}
    </>
  );
}
