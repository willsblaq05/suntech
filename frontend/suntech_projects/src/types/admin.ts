/**
 * Types mirroring the backend Lead API exactly
 * (backend/app/models/lead.py and backend/app/schemas/lead.py).
 *
 * Keep in sync with `LeadRead` on the back-office surface — these are the
 * same status values used by the public website's quote form (no second,
 * conflicting status system).
 */

export type LeadStatus = "pending" | "contacted" | "qualified" | "closed";
export type UserType = "residential" | "commercial" | "upgrade";
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
  /** Existing-system details (upgrade inquiries only). */
  improvement_goals: string[] | null;
  existing_inverter_kw: number | null;
  existing_battery_type: string | null;
  existing_battery_capacity: string | null;
  existing_system_notes: string | null;
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

// ---------------------------------------------------------------------------
// Testimonials (admin-verified customer stories)
// ---------------------------------------------------------------------------

export type TestimonialStatus = "pending" | "approved" | "rejected";

export interface Testimonial {
  id: string;
  lead_id: string | null;
  name: string;
  location: string;
  project_type: string;
  quote: string;
  /** Server-relative media URL, e.g. "/media/testimonial-<hash>.jpg". */
  photo_path: string | null;
  status: TestimonialStatus;
  created_at: string;
  updated_at: string;
}

/** Shape served by GET /api/v1/testimonials/public. */
export interface TestimonialPublic {
  id: string;
  name: string;
  location: string;
  project_type: string;
  quote: string;
  photo_path: string | null;
}

export const USER_TYPE_LABELS: Record<UserType, string> = {
  residential: "Residential",
  commercial: "Commercial",
  upgrade: "Upgrade",
};

/** Pretty labels for improvement-goal values (mirror backend enum). */
export const IMPROVEMENT_GOAL_LABELS: Record<string, string> = {
  capacity: "Increase capacity",
  batteries: "Battery upgrades",
  backup: "Longer backup",
  inverter: "Inverter replacement",
  performance: "Performance issues",
  expansion: "System expansion",
};

export function goalLabel(goal: string): string {
  return IMPROVEMENT_GOAL_LABELS[goal] ?? goal;
}

/** Capitalsation helper for stored battery chemistries. */
export function batteryTypeLabel(value: string | null): string {
  if (!value) return "Not sure";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export const BUDGET_RANGE_LABELS: Record<BudgetRange, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};
