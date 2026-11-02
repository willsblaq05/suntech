/**
 * Admin lead/inquiry API calls — thin wrappers over the existing backend
 * surface. No invented endpoints:
 *
 *   GET   /api/v1/leads            (list; filterable server-side, limit ≤ 100)
 *   GET   /api/v1/leads/{id}       (detail incl. internal notes)
 *   PATCH /api/v1/leads/{id}/status (workflow status update)
 */

import type { Lead, LeadStatus } from "../types/admin";
import { adminFetch, ApiError } from "./session";

const PAGE_SIZE = 100;
/** Hitting this cap means the operator sees a "showing first N" notice. */
const MAX_PAGES = 5;

export interface LeadCollection {
  leads: Lead[];
  /** True when the server held more leads than the client-side cap. */
  truncated: boolean;
}

export async function fetchAllLeads(): Promise<LeadCollection> {
  // The backend returns newest-first ordered pages without a total count,
  // so statistics and search aggregate pages until exhausted (or the cap).
  let collected: Lead[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const response = await adminFetch(
      `/api/v1/leads/?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`,
    );
    if (!response.ok) {
      throw new ApiError(
        response.status,
        "Could not load the inquiry list. Please try again.",
      );
    }
    const chunk = (await response.json()) as Lead[];
    collected = collected.concat(chunk);
    if (chunk.length < PAGE_SIZE) {
      return { leads: collected, truncated: false };
    }
  }
  return { leads: collected, truncated: true };
}

export async function fetchLead(id: string): Promise<Lead> {
  const response = await adminFetch(
    `/api/v1/leads/${encodeURIComponent(id)}`,
  );
  if (!response.ok) {
    throw new ApiError(
      response.status,
      response.status === 404
        ? "Inquiry not found. It may have been deleted."
        : "Could not load the inquiry. Please try again.",
    );
  }
  return (await response.json()) as Lead;
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<Lead> {
  const response = await adminFetch(
    `/api/v1/leads/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );
  if (!response.ok) {
    throw new ApiError(response.status, "Status update failed. Please try again.");
  }
  return (await response.json()) as Lead;
}
