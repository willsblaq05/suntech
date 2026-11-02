/** Top bar for mobile (the sidebar is hidden below the lg breakpoint). */

import { Wordmark } from "../ui/Wordmark";

interface AdminHeaderProps {
  onOpenSidebar: () => void;
  isDemo: boolean;
}

export function AdminHeader({ onOpenSidebar, isDemo }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-ink-900/10 bg-white/95 backdrop-blur lg:hidden">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-900 transition-colors hover:bg-sand-100"
          aria-label="Open navigation"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="h-6 w-6">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2.5">
          {isDemo && (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider text-amber-900">
              Demo
            </span>
          )}
          <Wordmark />
        </div>
      </div>
    </header>
  );
}
