/**
 * Dashboard overview — /admin/dashboard.
 *
 * All statistics are derived from the same lead list the backend serves to
 * /api/v1/leads (no invented figures). The overview splits the backend's
 * four statuses into back-office buckets: new (pending), under review
 * (contacted + qualified), completed (closed).
 */

import { Link } from "react-router-dom";

import { useAllLeads } from "../../api/useAdminLeads";
import { InquiryTable } from "../../components/admin/InquiryTable";
import { InquiryFilters } from "../../components/admin/InquiryFilters";
import type { StatusFilter, TypeFilter } from "../../components/admin/InquiryFilters";
import { StatCard } from "../../components/admin/StatCard";
import {
  EmptyState,
  ErrorState,
  TableSkeletonRows,
} from "../../components/admin/States";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "../../types/admin";
import type { LeadStatus } from "../../types/admin";
import { useInquiryBrowser } from "./useInquiryBrowser";

const RECENT_INQUIRIES = 5;

export function AdminDashboard() {
  const { leads, truncated, loading, error, reload } = useAllLeads();
  const browser = useInquiryBrowser(leads, RECENT_INQUIRIES);

  const total = leads.length;
  const newCount = leads.filter((lead) => lead.status === "pending").length;
  const underReviewCount = leads.filter(
    (lead) => lead.status === "contacted" || lead.status === "qualified",
  ).length;
  const completedCount = leads.filter((lead) => lead.status === "closed").length;

  const recent = browser.pageItems;
  const { search, statusFilter, typeFilter } = browser;

  function changeStatusFilter(value: StatusFilter) {
    browser.setStatusFilter(value);
    browser.setPage(0);
  }

  function changeTypeFilter(value: TypeFilter) {
    browser.setTypeFilter(value);
    browser.setPage(0);
  }

  return (
    <div>
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 text-ink-600">
          Overview of your solar inquiries and business activity.
        </p>
      </header>

      {/* Summary statistics */}
      <section aria-label="Inquiry statistics" className="mt-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total inquiries" value={total} loading={loading} />
          <StatCard
            label="New inquiries"
            value={loading ? null : newCount}
            hint="Pending — awaiting first contact"
            loading={loading}
          />
          <StatCard
            label="Under review"
            value={loading ? null : underReviewCount}
            hint="Contacted or qualified"
            loading={loading}
          />
          <StatCard
            label="Completed inquiries"
            value={loading ? null : completedCount}
            hint="Closed referrals"
            loading={loading}
          />
        </div>
      </section>

      {/* Recent inquiries */}
      <section aria-label="Recent inquiries" className="mt-8 grid items-start gap-6 xl:grid-cols-5">
        <div className="rounded-xl border border-ink-900/10 bg-white xl:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-900/10 px-6 py-4">
            <h2 className="text-base font-bold text-ink-900">Recent inquiries</h2>
            <Link
              to="/admin/inquiries"
              className="inline-flex items-center gap-1 text-sm font-semibold text-forest-700 transition-colors hover:text-forest-900 hover:underline"
            >
              View all inquiries
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {loading ? (
            <TableSkeletonRows rows={RECENT_INQUIRIES} />
          ) : error ? (
            <ErrorState
              title="Could not load inquiries"
              description={error.message}
              onRetry={reload}
            />
          ) : total === 0 ? (
            <EmptyState
              title="No inquiries yet"
              description="When customers submit the quote form on the website, their solar inquiries appear here."
            />
          ) : (
            <>
              {!search.trim() && statusFilter === "all" && typeFilter === "all" ? null : (
                <div className="border-b border-ink-900/10 bg-sand-100/60 px-6 py-4">
                  <InquiryFilters
                    compact
                    search={search}
                    onSearchChange={(value) => {
                      browser.setSearch(value);
                      browser.setPage(0);
                    }}
                    statusFilter={statusFilter}
                    onStatusFilterChange={changeStatusFilter}
                    typeFilter={typeFilter}
                    onTypeFilterChange={changeTypeFilter}
                  />
                </div>
              )}
              <InquiryTable leads={recent} />
              <PaginationFooter
                page={browser.page}
                pageCount={browser.pageCount}
                matchingCount={browser.matchingCount}
                onPageChange={browser.setPage}
                truncated={truncated}
              />
            </>
          )}
        </div>

        <div className="space-y-6 xl:col-span-2">
          {/* Status overview */}
          <div className="rounded-xl border border-ink-900/10 bg-white p-6">
            <h2 className="text-base font-bold text-ink-900">Inquiry status</h2>
            {loading ? (
              <div className="mt-4 space-y-3">
                {LEAD_STATUSES.map((status) => (
                  <div key={status} className="h-6 animate-pulse rounded-md bg-sand-200" />
                ))}
              </div>
            ) : (
              <ul className="mt-4 space-y-3.5">
                {LEAD_STATUSES.map((status: LeadStatus) => {
                  const count = leads.filter((lead) => lead.status === status).length;
                  const share = total === 0 ? 0 : (count / total) * 100;
                  const barTone: Record<LeadStatus, string> = {
                    pending: "bg-gold-400",
                    contacted: "bg-sky-400",
                    qualified: "bg-forest-600",
                    closed: "bg-ink-600/40",
                  };
                  return (
                    <li key={status}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="font-medium text-ink-900">
                          {LEAD_STATUS_LABELS[status]}
                        </span>
                        <span className="text-ink-600">
                          <span className="font-semibold text-ink-900">{count}</span>
                          {" "}· {Math.round(share)}%
                        </span>
                      </div>
                      <div
                        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-sand-200"
                        role="presentation"
                      >
                        <div
                          className={`h-full rounded-full ${barTone[status]}`}
                          style={{ width: `${share}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Shortcut */}
          <div className="rounded-xl border border-ink-900/10 bg-forest-950 p-6">
            <h2 className="text-base font-bold text-white">Work the pipeline</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Review pending inquiries, keep contacted customers moving, and
              refer qualified jobs to installation providers.
            </p>
            <Link
              to="/admin/inquiries"
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-gold-300 px-4 py-2 text-sm font-semibold text-forest-950 transition-colors hover:bg-gold-400"
            >
              Open inquiries
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export function PaginationFooter({
  page,
  pageCount,
  matchingCount,
  onPageChange,
  truncated = false,
}: {
  page: number;
  pageCount: number;
  matchingCount: number;
  onPageChange: (page: number) => void;
  truncated?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-ink-900/10 px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-ink-600">
        {matchingCount === 0
          ? "No matching inquiries"
          : `Showing page ${page + 1} of ${pageCount} (${matchingCount} ${
              matchingCount === 1 ? "inquiry" : "inquiries"
            })`}
        {truncated && (
          <>
            {" "}— showing the most recent from the server; older records may be omitted.
          </>
        )}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="rounded-lg border border-ink-900/15 bg-white px-3 py-1.5 text-xs font-semibold text-ink-900 transition-colors hover:bg-sand-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount - 1}
          className="rounded-lg border border-ink-900/15 bg-white px-3 py-1.5 text-xs font-semibold text-ink-900 transition-colors hover:bg-sand-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
