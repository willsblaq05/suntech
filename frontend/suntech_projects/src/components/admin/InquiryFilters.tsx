/** Search / status / type filters shared by the dashboard and inquiries pages. */

import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "../../types/admin";
import type { LeadStatus, UserType } from "../../types/admin";

export type StatusFilter = "all" | LeadStatus;
export type TypeFilter = "all" | UserType;

const SELECT_CLASSES =
  "w-full rounded-lg border border-ink-900/15 bg-white px-3 py-2 text-sm text-ink-900 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20";

interface InquiryFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  typeFilter: TypeFilter;
  onTypeFilterChange: (value: TypeFilter) => void;
  compact?: boolean;
}

export function InquiryFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  compact = false,
}: InquiryFiltersProps) {
  return (
    <div className={`grid gap-3 ${compact ? "sm:grid-cols-3" : "sm:grid-cols-4"}`}>
      <div className={compact ? "sm:col-span-3" : "sm:col-span-2"}>
        <label htmlFor="inquiry-search" className="sr-only">
          Search inquiries by name, email or phone
        </label>
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/50"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            id="inquiry-search"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search name, email or phone…"
            className={`${SELECT_CLASSES} pl-9`}
          />
        </div>
      </div>

      <div>
        <label htmlFor="inquiry-status-filter" className="sr-only">
          Filter by status
        </label>
        <select
          id="inquiry-status-filter"
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value as StatusFilter)}
          className={SELECT_CLASSES}
        >
          <option value="all">All statuses</option>
          {LEAD_STATUSES.map((status) => (
            <option key={status} value={status}>
              {LEAD_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="inquiry-type-filter" className="sr-only">
          Filter by inquiry type
        </label>
        <select
          id="inquiry-type-filter"
          value={typeFilter}
          onChange={(event) => onTypeFilterChange(event.target.value as TypeFilter)}
          className={SELECT_CLASSES}
        >
          <option value="all">All types</option>
          <option value="residential">Residential</option>
          <option value="commercial">Commercial</option>
        </select>
      </div>
    </div>
  );
}
