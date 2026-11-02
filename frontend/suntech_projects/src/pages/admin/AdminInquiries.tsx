/**
 * Full inquiry workspace — /admin/inquiries.
 *
 * Search, status/type filtering, and pagination run over the backend lead
 * list (client-side until the backend offers a text-search parameter).
 */

import { useAllLeads } from "../../api/useAdminLeads";
import { InquiryFilters } from "../../components/admin/InquiryFilters";
import type { StatusFilter, TypeFilter } from "../../components/admin/InquiryFilters";
import { InquiryTable } from "../../components/admin/InquiryTable";
import { EmptyState, ErrorState, TableSkeletonRows } from "../../components/admin/States";
import { useInquiryBrowser } from "./useInquiryBrowser";
import { PaginationFooter } from "./AdminDashboard";

const PAGE_SIZE = 10;

export function AdminInquiries() {
  const { leads, truncated, loading, error, reload } = useAllLeads();
  const browser = useInquiryBrowser(leads, PAGE_SIZE);

  // Changing a filter drops the operator back to the first page.
  function changeStatusFilter(value: StatusFilter) {
    browser.setStatusFilter(value);
    browser.setPage(0);
  }

  function changeTypeFilter(value: TypeFilter) {
    browser.setTypeFilter(value);
    browser.setPage(0);
  }

  const { search, statusFilter, typeFilter } = browser;

  return (
    <div>
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
          Inquiries
        </h1>
        <p className="mt-1 text-ink-600">
          Every solar inquiry submitted through the public quote form, newest
          first.
        </p>
      </header>

      <section aria-label="Inquiry list" className="mt-8">
        <div className="rounded-xl border border-ink-900/10 bg-white">
          <div
            className={`border-b border-ink-900/10 px-6 py-4 ${
              search.trim() !== "" || statusFilter !== "all" || typeFilter !== "all" ? "pb-3" : ""
            }`}
          >
            {loading ? (
              <div className="h-10 animate-pulse rounded-lg bg-sand-200" />
            ) : error ? null : leads.length > 0 ? (
              <InquiryFilters
                search={search}
                onSearchChange={(value) => { browser.setSearch(value); browser.setPage(0); }}
                statusFilter={statusFilter}
                onStatusFilterChange={changeStatusFilter}
                typeFilter={typeFilter}
                onTypeFilterChange={changeTypeFilter}
              />
            ) : null}
          </div>

          {loading ? (
            <>
              <TableSkeletonRows rows={PAGE_SIZE} />
              <span className="sr-only">Loading inquiries…</span>
            </>
          ) : error ? (
            <ErrorState title="Could not load inquiries" description={error.message} onRetry={reload} />
          ) : leads.length === 0 ? (
            <EmptyState
              title="No inquiries yet"
              description="When customers submit the quote form on the website, their solar inquiries appear here."
            />
          ) : browser.matchingCount === 0 ? (
            <EmptyState
              title="No matching inquiries"
              description="No inquiries match the current search or filters. Try clearing the search box or switching the status and type filters back to 'all'."
            />
          ) : (
            <>
              <InquiryTable leads={browser.pageItems} />
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
      </section>
    </div>
  );
}
