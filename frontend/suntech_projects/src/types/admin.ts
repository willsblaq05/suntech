/**
 * Types mirroring the backend Lead API exactly
 * (backend/app/models/lead.py and backend/app/schemas/lead.py).
 *
 * Keep in sync with `LeadRead` on the back-office surface — these are the
 * same status values used by the public website's quote form (no second,
 * conflicting status system).
 */

export type LeadStatus = "pending" | "contacted" | "qualified" | "closed";
export type UserType = "residential" | "commercial";
export type BudgetRange = "low" | "medium" | "high";

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  user_type: UserType;
  state: string;
  city: string | null;
  budget_range: BudgetRange | null;
  system_size_kw: number | null;
  status: LeadStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const LEAD_STATUSES: readonly LeadStatus[] = [
  "pending",
  "contacted",
  "qualified",
  "closed",
];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  pending: "Pending",
  contacted: "Contacted",
  qualified: "Qualified",
  closed: "Closed",
};

export const USER_TYPE_LABELS: Record<UserType, string> = {
  residential: "Residential",
  commercial: "Commercial",
};

export const BUDGET_RANGE_LABELS: Record<BudgetRange, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};
