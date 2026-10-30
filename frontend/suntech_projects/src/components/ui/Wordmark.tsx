interface WordmarkProps {
  /** "light" for light backgrounds (nav), "dark" for dark ones (footer). */
  tone?: "light" | "dark";
}

export function Wordmark({ tone = "light" }: WordmarkProps) {
  const primary = tone === "light" ? "text-forest-950" : "text-white";
  const secondary = tone === "light" ? "text-forest-700" : "text-gold-300";

  return (
    <span className="inline-flex items-center gap-2.5">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="h-8 w-8 text-gold-400"
      >
        <circle cx="12" cy="12" r="4.5" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 2.2v2.3M12 19.5v2.3M2.2 12h2.3M19.5 12h2.3M5.1 5.1l1.6 1.6M17.3 17.3l1.6 1.6M18.9 5.1l-1.6 1.6M6.7 17.3l-1.6 1.6" />
        </g>
      </svg>
      <span className="flex items-baseline gap-2 leading-none">
        <span className={`text-lg font-extrabold tracking-tight ${primary}`}>
          SUNTECH
        </span>
        <span
          className={`text-sm font-semibold tracking-[0.3em] ${secondary}`}
        >
          PROJECTS
        </span>
      </span>
    </span>
  );
}
