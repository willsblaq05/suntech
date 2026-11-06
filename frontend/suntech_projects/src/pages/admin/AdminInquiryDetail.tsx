/**
 * Inquiry detail — /admin/inquiries/:id.
 *
 * Displays the full record (including internal notes, which are
 * admin-only and never echo to the public site) and updates the workflow
 * status through PATCH /api/v1/leads/{id}/status.
 *
 * Backend limitation: the LeadUpdate schema does not accept note edits
 * yet, so notes are read-only here until the backend adds that surface.
 */

import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useLeadDetail } from "../../api/useAdminLeads";
import { InquiryStatusBadge } from "../../components/admin/InquiryStatusBadge";
import { ErrorState, SkeletonBlock, SuccessNotice } from "../../components/admin/States";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  USER_TYPE_LABELS,
  batteryTypeLabel,
  goalLabel,
} from "../../types/admin";
import type { LeadStatus } from "../../types/admin";
import {
  formatBudget,
  formatDateTime,
  formatLocation,
  formatSystemSize,
} from "../../utils/format";

const FIELD_CLASS = "text-sm text-ink-900";
const LABEL_CLASS =
  "text-xs font-semibold uppercase tracking-[0.12em] text-ink-600";

export function AdminInquiryDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const { lead, loading, error, changeStatus, savingStatus, statusError } =
    useLeadDetail(id);
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl" aria-busy="true">
        <SkeletonBlock className="h-4 w-36" />
        <div className="mt-6 rounded-xl border border-ink-900/10 bg-white p-6">
          <SkeletonBlock className="h-7 w-52" />
          <SkeletonBlock className="mt-2 h-5 w-40" />
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 8 }, (_, index) => (
              <SkeletonBlock key={index} className="h-4 w-full max-w-xs" />
            ))}
          </div>
        </div>
        <span className="sr-only">Loading inquiry…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <Link
          to="/admin/inquiries"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 underline-offset-4 hover:underline"
        >
          ← All inquiries
        </Link>
        <div className="mt-6 rounded-xl border border-ink-900/10 bg-white">
          <ErrorState title="This inquiry could not be loaded" description={error.message} />
        </div>
      </div>
    );
  }

  if (lead === null) {
    return (
      <div className="mx-auto max-w-3xl">
        <Link
          to="/admin/inquiries"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 underline-offset-4 hover:underline"
        >
          ← All inquiries
        </Link>
        <div className="mt-6 rounded-xl border border-ink-900/10 bg-white">
          <ErrorState
            title="Inquiry not found"
            description="This inquiry may have been deleted, or it exists only in live data while you are in demo mode."
          />
        </div>
      </div>
    );
  }

  const activeStatus = selectedStatus ?? lead.status;

  async function handleStatusUpdate() {
    setJustSaved(false);
    await changeStatus(activeStatus);
    if (selectedStatus) {
      setJustSaved(true);
      setSelectedStatus(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/admin/inquiries"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 underline-offset-4 hover:underline"
      >
        ← All inquiries
      </Link>

      <article className="mt-4 rounded-xl border border-ink-900/10 bg-white">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-ink-900/10 px-6 py-5">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">
              {lead.name}
            </h1>
            <p className="mt-1 text-sm text-ink-600">
              Submitted {formatDateTime(lead.created_at)} · {formatLocation(lead.city, lead.state)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <InquiryStatusBadge status={lead.status} />
            {lead.notes !== null && (
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-600">
                Internal
              </span>
            )}
          </div>
        </header>

        <dl className="grid gap-x-8 gap-y-5 px-6 py-6 sm:grid-cols-2">
          <div>
            <dt className={LABEL_CLASS}>Phone</dt>
            <dd className={`mt-1 ${FIELD_CLASS}`}>
              <a href={`tel:${lead.phone}`} className="font-semibold text-forest-800 hover:underline">
                {lead.phone}
              </a>
            </dd>
          </div>
          <div>
            <dt className={LABEL_CLASS}>Email</dt>
            <dd className={`mt-1 ${FIELD_CLASS}`}>
              {lead.email ? (
                <a href={`mailto:${lead.email}`} className="text-forest-800 hover:underline">
                  {lead.email}
                </a>
              ) : (
                <span className="text-ink-600">Not provided</span>
              )}
            </dd>
          </div>
          <div>
            <dt className={LABEL_CLASS}>Inquiry type</dt>
            <dd className={`mt-1 font-semibold ${FIELD_CLASS}`}>
              {USER_TYPE_LABELS[lead.user_type]}
            </dd>
          </div>
          <div>
            <dt className={LABEL_CLASS}>Location</dt>
            <dd className={`mt-1 ${FIELD_CLASS}`}>{formatLocation(lead.city, lead.state)}</dd>
          </div>
          <div>
            <dt className={LABEL_CLASS}>Budget range</dt>
            <dd className={`mt-1 ${FIELD_CLASS}`}>{formatBudget(lead.budget_range)}</dd>
          </div>
          <div>
            <dt className={LABEL_CLASS}>Requested system size</dt>
            <dd className={`mt-1 ${FIELD_CLASS}`}>{formatSystemSize(lead.system_size_kw)}</dd>
          </div>
        </dl>

        {/* Existing-system details — upgrade inquiries only */}
        {lead.user_type === "upgrade" && (
          <div className="border-t border-ink-900/10 px-6 py-5">
            <h2 className={LABEL_CLASS}>Existing system</h2>
            <dl className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className={LABEL_CLASS}>Improvement goals</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {(lead.improvement_goals ?? []).length === 0 ? (
                    <span className={`${FIELD_CLASS} text-ink-600`}>None recorded</span>
                  ) : (
                    (lead.improvement_goals ?? []).map((goal) => (
                      <span
                        key={goal}
                        className="inline-block rounded-md border border-sky-300 bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-900"
                      >
                        {goalLabel(goal)}
                      </span>
                    ))
                  )}
                </dd>
              </div>
              <div>
                <dt className={LABEL_CLASS}>Existing inverter</dt>
                <dd className={`mt-1 ${FIELD_CLASS}`}>
                  {lead.existing_inverter_kw === null
                    ? "Not sure"
                    : `${formatSystemSize(lead.existing_inverter_kw)}`}
                </dd>
              </div>
              <div>
                <dt className={LABEL_CLASS}>Existing battery</dt>
                <dd className={`mt-1 ${FIELD_CLASS}`}>
                  {batteryTypeLabel(lead.existing_battery_type)}
                  {lead.existing_battery_capacity
                    ? ` · ${lead.existing_battery_capacity}`
                    : ""}
                </dd>
              </div>
              {lead.existing_system_notes && (
                <div className="sm:col-span-2">
                  <dt className={LABEL_CLASS}>System description</dt>
                  <dd className="mt-2 whitespace-pre-line rounded-lg border border-ink-900/10 bg-sand-100 px-4 py-3 text-sm leading-relaxed text-ink-900">
                    {lead.existing_system_notes}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Status update */}
        <div className="border-t border-ink-900/10 px-6 py-5">
          <h2 className={LABEL_CLASS}>Workflow status</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label htmlFor="inquiry-status" className="sr-only">
              Change workflow status
            </label>
            <select
              id="inquiry-status"
              value={activeStatus}
              onChange={(event) => {
                setSelectedStatus(event.target.value as LeadStatus);
                setJustSaved(false);
              }}
              className="rounded-lg border border-ink-900/15 bg-white px-3 py-2 text-sm text-ink-900 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20"
            >
              {LEAD_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {LEAD_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleStatusUpdate}
              disabled={savingStatus || activeStatus === lead.status}
              className="inline-flex items-center justify-center rounded-lg bg-forest-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingStatus ? "Saving…" : "Update status"}
            </button>
            {activeStatus !== lead.status && !savingStatus && (
              <span className="text-xs text-ink-600">Unsaved change</span>
            )}
          </div>

          {statusError && (
            <p
              role="alert"
              className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800"
            >
              {statusError}
            </p>
          )}
          {!statusError && justSaved && (
            <div className="mt-3">
              <SuccessNotice>
                Status updated to {LEAD_STATUS_LABELS[lead.status]}.
              </SuccessNotice>
            </div>
          )}
          <p className="mt-3 text-xs text-ink-600">
            Current status: {LEAD_STATUS_LABELS[lead.status]}. Values come
            directly from the backend workflow (pending, contacted,
            qualified, closed).
          </p>
        </div>

        {/* Internal notes — admin only; the public API never exposes this field. */}
        <div className="border-t border-ink-900/10 px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className={LABEL_CLASS}>Internal notes</h2>
            <span className="rounded-full border border-ink-900/15 bg-sand-100 px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider text-ink-600">
              Never shown to customers
            </span>
          </div>
          {lead.notes ? (
            <p className="mt-3 whitespace-pre-line rounded-lg border border-ink-900/10 bg-sand-100 px-4 py-3 text-sm leading-relaxed text-ink-900">
              {lead.notes}
            </p>
          ) : (
            <p className="mt-3 rounded-lg border border-dashed border-ink-900/15 px-4 py-3 text-sm text-ink-600">
              No notes yet.
            </p>
          )}
          <p className="mt-2 text-xs text-ink-600">
            Note editing needs a backend addition (the update schema does not
            accept notes yet) — display is live the moment notes exist.
          </p>
        </div>
      </article>
    </div>
  );
}
