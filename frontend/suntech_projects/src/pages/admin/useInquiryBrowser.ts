/**
 * Client-side search/filter/pagination for the inquiry browser.
 *
 * The backend has no text-search or total-count endpoint yet, so search
 * runs over the fetched lead list; pages are sliced locally. This is
 * wired to real backend data — when the backend gains a `q`/`total`
 * parameter this hook is the only place to change.
 */

import { useMemo, useState } from "react";

import type { StatusFilter, TypeFilter } from "../../components/admin/InquiryFilters";
import type { Lead } from "../../types/admin";

export function useInquiryBrowser(leads: Lead[], pageSize: number) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (statusFilter !== "all" && lead.status !== statusFilter) return false;
      if (typeFilter !== "all" && lead.user_type !== typeFilter) return false;
      if (query === "") return true;
      return [lead.name, lead.email ?? "", lead.phone].some((value) =>
        value.toLowerCase().includes(query),
      );
    });
  }, [leads, search, statusFilter, typeFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  // Clamped in render instead of reset in an effect — pages never go stale.
  const currentPage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(
    currentPage * pageSize,
    currentPage * pageSize + pageSize,
  );

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    page: currentPage,
    setPage,
    pageCount,
    pageItems,
    matchingCount: filtered.length,
  };
}
