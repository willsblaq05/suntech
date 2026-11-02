/** Status pill using the backend's exact status values (no second system). */

import { LEAD_STATUS_LABELS, type LeadStatus } from "../../types/admin";

const BADGE_STYLES: Record<LeadStatus, string> = {
  pending: "border-amber-300 bg-amber-50 text-amber-900",
  contacted: "border-sky-300 bg-sky-50 text-sky-900",
  qualified: "border-forest-300 bg-forest-100 text-forest-800",
  closed: "border-ink-900/15 bg-sand-100 text-ink-600",
};

export function InquiryStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${BADGE_STYLES[status]}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {LEAD_STATUS_LABELS[status]}
    </span>
  );
}
