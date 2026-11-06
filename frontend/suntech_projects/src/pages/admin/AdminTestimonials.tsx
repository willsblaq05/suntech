/**
 * Testimonials workspace — /admin/testimonials.
 *
 * The verification workflow in one screen:
 *   record (pending) → review → approve (goes public) / reject.
 * Photos are optional and sanitised server-side before storage.
 */

import { useRef, useState, type FormEvent } from "react";

import { useTestimonials } from "../../api/useAdminTestimonials";
import {
  createTestimonial,
  deleteTestimonial,
  updateTestimonial,
  uploadTestimonialPhoto,
} from "../../api/testimonials";
import {
  EmptyState,
  ErrorState,
  SkeletonBlock,
  SuccessNotice,
} from "../../components/admin/States";
import { useAdminAuth } from "../../auth/useAdminAuth";
import { apiUrl } from "../../api/session";
import type { Testimonial, TestimonialStatus } from "../../types/admin";

const STATUS_LABELS: Record<TestimonialStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
};

const BADGE_STYLES: Record<TestimonialStatus, string> = {
  pending: "border-amber-300 bg-amber-50 text-amber-900",
  approved: "border-forest-300 bg-forest-100 text-forest-800",
  rejected: "border-ink-900/15 bg-sand-100 text-ink-600",
};

function TestimonialStatusBadge({ status }: { status: TestimonialStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${BADGE_STYLES[status]}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  );
}

const inputClasses =
  "w-full rounded-lg border border-ink-900/15 bg-white px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-600/50 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20";
const labelClasses = "block text-sm font-semibold text-ink-900";

interface AddPanelProps {
  onSaved: (message: string) => void;
}

function AddTestimonialPanel({ onSaved }: AddPanelProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [projectType, setProjectType] = useState("");
  const [quote, setQuote] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const photoInputId = "testimonial-photo-input";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (quote.trim().length < 10) {
      setError("The quote needs at least 10 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await createTestimonial({
        name: name.trim(),
        location: location.trim(),
        project_type: projectType.trim(),
        quote: quote.trim(),
      });
      if (photo) {
        await uploadTestimonialPhoto(created.id, photo);
      }
      setSavedState();
      onSaved("Testimonial recorded — review it, then approve to publish.");
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Saving failed.");
    } finally {
      setSubmitting(false);
    }
  }

  function setSavedState() {
    setName("");
    setLocation("");
    setProjectType("");
    setQuote("");
    setPhoto(null);
    const input = document.getElementById(photoInputId) as HTMLInputElement | null;
    if (input) input.value = "";
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-ink-900/10 bg-white p-6"
      aria-label="Add a verified testimonial"
    >
      <h2 className="text-base font-bold text-ink-900">Record a verified story</h2>
      <p className="mt-1 text-sm text-ink-600">
        Verified means you have confirmed the customer and their project.
        Saved stories stay <strong>pending</strong> until you approve them.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="testimonial-name" className={labelClasses}>Customer name</label>
          <input
            id="testimonial-name"
            type="text"
            required
            minLength={2}
            maxLength={100}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={`mt-1.5 ${inputClasses}`}
            placeholder="e.g. Adamma Okafor"
          />
        </div>
        <div>
          <label htmlFor="testimonial-location" className={labelClasses}>Location</label>
          <input
            id="testimonial-location"
            type="text"
            required
            minLength={2}
            maxLength={100}
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className={`mt-1.5 ${inputClasses}`}
            placeholder="e.g. Independence Layout, Enugu"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="testimonial-project" className={labelClasses}>Project summary</label>
          <input
            id="testimonial-project"
            type="text"
            required
            minLength={2}
            maxLength={120}
            value={projectType}
            onChange={(event) => setProjectType(event.target.value)}
            className={`mt-1.5 ${inputClasses}`}
            placeholder="e.g. Residential · 3.5 kW with battery upgrade"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="testimonial-quote" className={labelClasses}>
            The quote <span aria-hidden="true" className="text-red-700">*</span>
          </label>
          <textarea
            id="testimonial-quote"
            required
            rows={4}
            minLength={10}
            maxLength={1000}
            value={quote}
            onChange={(event) => setQuote(event.target.value)}
            className={`mt-1.5 ${inputClasses} resize-y`}
            placeholder="In the customer's words… (never paste phone numbers or emails here)"
          />
          <p className="mt-1 text-xs text-ink-600">{quote.trim().length}/1000 characters</p>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={photoInputId} className={labelClasses}>
            Photo <span className="font-normal text-ink-600">(optional — verified project or customer)</span>
          </label>
          <input
            id={photoInputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
            className="mt-1.5 block w-full text-sm text-ink-600 file:mr-3 file:rounded-lg file:border-0 file:bg-forest-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-forest-800"
          />
          <p className="mt-1 text-xs text-ink-600">
            JPEG, PNG or WebP up to 5 MB. EXIF location data is stripped and
            the image is re-encoded on the server.
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 inline-flex items-center justify-center rounded-lg bg-forest-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Save for review"}
      </button>
    </form>
  );
}

interface TestimonialCardProps {
  testimonial: Testimonial;
  busy: boolean;
  onStatusChange: (
    testimonial: Testimonial,
    status: TestimonialStatus,
  ) => void;
  onDelete: (testimonial: Testimonial) => void;
}

function TestimonialCard({
  testimonial,
  busy,
  onStatusChange,
  onDelete,
}: TestimonialCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <article className="rounded-xl border border-ink-900/10 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {testimonial.photo_path && (
            <img
              src={apiUrl(testimonial.photo_path)}
              alt={`Project photo for ${testimonial.name}`}
              loading="lazy"
              decoding="async"
              className="h-14 w-14 shrink-0 rounded-lg border border-ink-900/10 object-cover"
            />
          )}
          <div className="min-w-0">
            <p className="truncate font-bold text-ink-900">{testimonial.name}</p>
            <p className="truncate text-xs text-ink-600">{testimonial.location}</p>
          </div>
        </div>
        <TestimonialStatusBadge status={testimonial.status} />
      </div>

      <span className="mt-4 flex">
        <span className="inline-block rounded-md border border-forest-300 bg-forest-100 px-2 py-0.5 text-[0.7rem] font-semibold text-forest-800">
          {testimonial.project_type}
        </span>
      </span>

      <blockquote className="mt-3 text-sm leading-relaxed text-ink-900">
        “{testimonial.quote}”
      </blockquote>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-ink-900/10 pt-4">
        {testimonial.status !== "approved" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onStatusChange(testimonial, "approved")}
            className="inline-flex items-center rounded-lg bg-forest-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-forest-800 disabled:opacity-50"
          >
            ✓ Approve — publish
          </button>
        )}
        {testimonial.status !== "rejected" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onStatusChange(testimonial, "rejected")}
            className="inline-flex items-center rounded-lg border border-ink-900/15 bg-white px-3 py-1.5 text-xs font-semibold text-ink-900 transition-colors hover:bg-sand-100 disabled:opacity-50"
          >
            Reject — keep private
          </button>
        )}
        {confirmingDelete ? (
          <span className="inline-flex items-center gap-2 text-xs">
            <span className="text-ink-600">Delete permanently?</span>
            <button
              type="button"
              disabled={busy}
              onClick={() => onDelete(testimonial)}
              className="rounded-lg bg-red-700 px-3 py-1.5 font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-50"
            >
              Yes, delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="rounded-lg border border-ink-900/15 px-3 py-1.5 font-semibold text-ink-900 transition-colors hover:bg-sand-100"
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmingDelete(true)}
            className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold text-red-800 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>
    </article>
  );
}

export function AdminTestimonials() {
  const { testimonials, loading, error, reload } = useTestimonials();
  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | TestimonialStatus>("all");
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const noticeTimer = useRef<number | null>(null);
  const isDemo = useAdminAuth().isDemo;

  const filtered =
    statusFilter === "all"
      ? testimonials
      : testimonials.filter((testimonial) => testimonial.status === statusFilter);

  function flashNotice(message: string) {
    setNotice(message);
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => {
      setNotice(null);
      noticeTimer.current = null;
    }, 5000);
  }

  async function changeStatus(
    testimonial: Testimonial,
    status: TestimonialStatus,
  ) {
    setBusyId(testimonial.id);
    setActionError(null);
    try {
      await updateTestimonial(testimonial.id, { status });
      flashNotice(
        status === "approved"
          ? "Approved — the story is now on the website."
          : "Rejected — the story will not appear publicly.",
      );
      reload();
    } catch (cause: unknown) {
      setActionError(cause instanceof Error ? cause.message : "Update failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(testimonial: Testimonial) {
    setBusyId(testimonial.id);
    setActionError(null);
    try {
      await deleteTestimonial(testimonial.id);
      flashNotice("Testimonial deleted (including its photo file).");
      reload();
    } catch (cause: unknown) {
      setActionError(cause instanceof Error ? cause.message : "Delete failed.");
    } finally {
      setBusyId(null);
    }
  }

  if (isDemo) {
    return (
      <div>
        <header>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
            Testimonials
          </h1>
          <p className="mt-1 text-ink-600">
            The demo preview has no persisted testimonials — connect the
            backend to run the verification workflow.
          </p>
        </header>
        <div className="mt-8 rounded-xl border border-ink-900/10 bg-white p-8 text-sm text-ink-600">
          Nothing to demo here by design: recording and approving stories
          writes to the database, and demo sessions never persist anything.
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
            Testimonials
          </h1>
          <p className="mt-1 text-ink-600">
            Verified customer stories. Nothing is public until it is approved
            here.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="testimonial-status-filter" className="sr-only">
            Filter by status
          </label>
          <select
            id="testimonial-status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "all" | TestimonialStatus)
            }
            className="rounded-lg border border-ink-900/15 bg-white px-3 py-2 text-sm text-ink-900 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            type="button"
            onClick={() => setAddPanelOpen((open) => !open)}
            aria-expanded={addPanelOpen}
            className="inline-flex items-center justify-center rounded-lg bg-gold-300 px-4 py-2 text-sm font-semibold text-forest-950 transition-colors hover:bg-gold-400"
          >
            {addPanelOpen ? "Close form" : "Add testimonial"}
          </button>
        </div>
      </header>

      {notice && (
        <div className="mt-6">
          <SuccessNotice>{notice}</SuccessNotice>
        </div>
      )}
      {actionError && (
        <div className="mt-6" role="alert">
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
            {actionError}
          </p>
        </div>
      )}

      {addPanelOpen && (
        <div className="mt-6">
          <AddTestimonialPanel
            onSaved={(message) => {
              flashNotice(message);
              reload();
            }}
          />
        </div>
      )}

      <section aria-label="Testimonial queue" className="mt-8">
        {loading ? (
          <div className="grid gap-4 lg:grid-cols-2" aria-busy="true">
            {Array.from({ length: 4 }, (_, index) => (
              <SkeletonBlock key={index} className="h-48 w-full" />
            ))}
            <span className="sr-only">Loading testimonials…</span>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-ink-900/10 bg-white">
            <ErrorState
              title="Could not load testimonials"
              description={error.message}
              onRetry={reload}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-ink-900/10 bg-white">
            <EmptyState
              title={
                testimonials.length === 0
                  ? "No testimonials yet"
                  : "No testimonials with this status"
              }
              description={
                testimonials.length === 0
                  ? "After a project is completed and verified, record the customer's words here — only approved stories go public."
                  : "Try switching the status filter back to 'all'."
              }
            />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.map((testimonial) => (
              <TestimonialCard
                key={testimonial.id}
                testimonial={testimonial}
                busy={busyId === testimonial.id}
                onStatusChange={changeStatus}
                onDelete={remove}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
