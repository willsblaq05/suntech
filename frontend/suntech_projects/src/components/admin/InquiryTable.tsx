/** The admin inquiry table — columns per the back-office spec. */

import { Link } from "react-router-dom";

import { InquiryStatusBadge } from "./InquiryStatusBadge";
import { USER_TYPE_LABELS } from "../../types/admin";
import type { Lead } from "../../types/admin";
import { formatDate, formatLocation } from "../../utils/format";

const HEAD_CLASS =
  "px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink-600";
const CELL_CLASS = "px-4 py-3 align-middle";

export function InquiryTable({ leads }: { leads: Lead[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-ink-900/10">
          <tr>
            <th scope="col" className={HEAD_CLASS}>Customer</th>
            <th scope="col" className={HEAD_CLASS}>Contact</th>
            <th scope="col" className={HEAD_CLASS}>Type</th>
            <th scope="col" className={HEAD_CLASS}>Location</th>
            <th scope="col" className={HEAD_CLASS}>Submitted</th>
            <th scope="col" className={HEAD_CLASS}>Status</th>
            <th scope="col" className={`${HEAD_CLASS} text-right`}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-900/5">
          {leads.map((lead) => (
            <tr key={lead.id} className="transition-colors hover:bg-sand-100/70">
              <td className={CELL_CLASS}>
                <span className="font-semibold text-ink-900">{lead.name}</span>
                {lead.email && (
                  <span className="mt-0.5 block text-xs text-ink-600">{lead.email}</span>
                )}
              </td>
              <td className={`${CELL_CLASS} whitespace-nowrap text-ink-900`}>{lead.phone}</td>
              <td className={CELL_CLASS}>
                <span
                  className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${
                    lead.user_type === "commercial"
                      ? "border-forest-300 bg-forest-100 text-forest-800"
                      : lead.user_type === "upgrade"
                        ? "border-sky-300 bg-sky-50 text-sky-900"
                        : "border-gold-400 bg-gold-300/25 text-forest-900"
                  }`}
                >
                  {USER_TYPE_LABELS[lead.user_type]}
                </span>
              </td>
              <td className={`${CELL_CLASS} text-ink-600`}>
                {formatLocation(lead.city, lead.state)}
              </td>
              <td className={`${CELL_CLASS} whitespace-nowrap text-ink-600`}>
                {formatDate(lead.created_at)}
              </td>
              <td className={CELL_CLASS}>
                <InquiryStatusBadge status={lead.status} />
              </td>
              <td className={`${CELL_CLASS} text-right`}>
                <Link
                  to={`/admin/inquiries/${lead.id}`}
                  className="inline-flex items-center gap-1 font-semibold text-forest-700 transition-colors hover:text-forest-900 hover:underline"
                >
                  View
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

