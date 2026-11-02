/** Permanent demo-mode notice so sample data is never read as real. */

export function DemoBanner() {
  return (
    <div
      role="status"
      className="flex items-center gap-3 border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 sm:px-6"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-4 w-4 shrink-0"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      <span>
        <strong className="font-semibold">Demo preview.</strong> Everything below
        is sample data used without a connected backend — nothing here is real
        and no changes are saved.
      </span>
    </div>
  );
}
