/**
 * Shared UI states for the admin dashboard — skeletons, empty, and error
 * states, so no admin screen is ever left blank when data is unavailable.
 */

import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
}

/** Generic empty-result block (no inquiries at all, or no search matches). */
export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-6 py-14 text-center">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-9 w-9 text-ink-600/40"
      >
        <path d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h8l4 4v-4h0a2 2 0 0 0 2-2z" />
      </svg>
      <p className="mt-3 text-sm font-semibold text-ink-900">{title}</p>
      <p className="max-w-sm text-sm text-ink-600">{description}</p>
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Something went wrong", description, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-1 px-6 py-14 text-center"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-9 w-9 text-red-700/60"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      <p className="mt-3 text-sm font-semibold text-ink-900">{title}</p>
      <p className="max-w-sm text-sm text-ink-600">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center justify-center rounded-lg border border-ink-900/15 bg-white px-4 py-2 text-sm font-semibold text-forest-800 transition-colors hover:bg-sand-100"
        >
          Try again
        </button>
      )}
    </div>
  );
}

/** Shimmering placeholder block used while lists and stats load. */
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-md bg-sand-200 ${className}`} />;
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-ink-900/10 bg-white p-5" aria-busy="true">
      <SkeletonBlock className="h-3 w-24" />
      <SkeletonBlock className="mt-3 h-8 w-16" />
      <SkeletonBlock className="mt-3 h-3 w-32" />
    </div>
  );
}

export function TableSkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-6" aria-busy="true">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4">
          <SkeletonBlock className="h-4 w-32 shrink-0" />
          <SkeletonBlock className="h-4 w-36 shrink-0" />
          <SkeletonBlock className="h-4 w-24 shrink-0" />
          <SkeletonBlock className="h-4 flex-1" />
          <SkeletonBlock className="h-6 w-20 shrink-0" />
        </div>
      ))}
      <span className="sr-only">Loading inquiries…</span>
    </div>
  );
}

/** Inline notice for successful actions (e.g. status saved). */
export function SuccessNotice({ children }: { children: ReactNode }) {
  return (
    <p
      role="status"
      className="rounded-lg border border-forest-600/30 bg-forest-100 px-4 py-2.5 text-sm font-medium text-forest-800"
    >
      {children}
    </p>
  );
}
