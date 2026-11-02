/** Summary statistic card. The value always comes from the backend lead list. */

interface StatCardProps {
  label: string;
  value: number | null;
  hint?: string;
  loading?: boolean;
}

export function StatCard({ label, value, hint, loading = false }: StatCardProps) {
  if (loading || value === null) {
    return (
      <div className="rounded-xl border border-ink-900/10 bg-white p-5" aria-busy="true">
        <div className="h-3 w-24 rounded-md bg-sand-200 animate-pulse" />
        <div className="mt-3 h-8 w-16 rounded-md bg-sand-200 animate-pulse" />
        <div className="mt-3 h-3 w-28 rounded-md bg-sand-200 animate-pulse" />
        <span className="sr-only">Loading {label.toLowerCase()}…</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-ink-900/10 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-600">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-forest-950">
        {value.toLocaleString()}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-600">{hint}</p>}
    </div>
  );
}

