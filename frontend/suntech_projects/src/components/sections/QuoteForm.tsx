import { useId, useState, type FormEvent } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") ?? "";

type Status = "idle" | "submitting" | "success" | "error";

type RequestType = "residential" | "commercial" | "upgrade";

/** Values mirror the backend schema (app/schemas/lead.py). */
const IMPROVEMENT_GOALS = [
  ["capacity", "Increase solar capacity"],
  ["batteries", "Upgrade batteries"],
  ["backup", "Improve backup duration"],
  ["inverter", "Replace or upgrade the inverter"],
  ["performance", "Troubleshoot underperformance"],
  ["expansion", "Expand the existing installation"],
] as const;

const BATTERY_TYPES = [
  ["lithium", "Lithium"],
  ["agm", "AGM"],
  ["gel", "Gel"],
  ["tubular", "Tubular (lead-acid)"],
] as const;

interface FormState {
  name: string;
  email: string;
  phone: string;
  userType: RequestType;
  city: string;
  budget: "" | "low" | "medium" | "high";
  systemSize: string;
  // ---- Existing-system details (upgrade requests only) ------------------- //
  goals: string[];
  inverterKw: string;
  inverterUnknown: boolean;
  batteryType: string;
  batteryCapacity: string;
  batteryCapacityUnknown: boolean;
  systemNotes: string;
}

const INITIAL: FormState = {
  name: "",
  email: "",
  phone: "",
  userType: "residential",
  city: "",
  budget: "",
  systemSize: "",
  goals: [],
  inverterKw: "",
  inverterUnknown: false,
  batteryType: "",
  batteryCapacity: "",
  batteryCapacityUnknown: false,
  systemNotes: "",
};

/** Mirrors LeadCreate on the backend (status/notes/timestamps are system-managed).
 *  Upgrade-specific fields are only ever sent for upgrade requests so the API
 *  never receives fields its validation would reject. */
function toPayload(form: FormState) {
  const base = {
    name: form.name.trim(),
    email: form.email.trim() === "" ? undefined : form.email.trim(),
    phone: form.phone,
    user_type: form.userType,
    city: form.city.trim() === "" ? undefined : form.city.trim(),
    budget_range: form.budget === "" ? undefined : form.budget,
    system_size_kw:
      form.systemSize.trim() === "" ? undefined : Number(form.systemSize),
  };

  if (form.userType !== "upgrade") return base;

  return {
    ...base,
    improvement_goals: form.goals.length > 0 ? form.goals : undefined,
    existing_inverter_kw:
      form.inverterUnknown || form.inverterKw.trim() === ""
        ? undefined
        : Number(form.inverterKw),
    existing_battery_type:
      form.batteryType === "" ? undefined : form.batteryType,
    existing_battery_capacity:
      form.batteryCapacityUnknown || form.batteryCapacity.trim() === ""
        ? undefined
        : form.batteryCapacity.trim(),
    existing_system_notes: form.systemNotes.trim(),
  };
}

function extractErrorDetail(detail: unknown): string | null {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (
      typeof first === "object" &&
      first !== null &&
      "msg" in first &&
      typeof first.msg === "string"
    ) {
      return first.msg;
    }
  }
  return null;
}

const INPUT_CLASSES =
  "w-full rounded-lg border border-ink-900/15 bg-white px-4 py-2.5 text-base text-ink-900 placeholder:text-ink-600/50 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20 disabled:cursor-not-allowed disabled:bg-sand-100 disabled:text-ink-600/60";

const LABEL_CLASSES = "block text-sm font-semibold text-ink-900";

const CHECK_CLASS =
  "mt-2 h-4 w-4 shrink-0 accent-forest-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400";

interface QuoteFormProps {
  /** Fired once a lead is accepted by the API (HTTP 201). */
  onSubmitted?: () => void;
}

export function QuoteForm({ onSubmitted }: QuoteFormProps) {
  // The form can be rendered in several places at once (e.g. the FinalCta
  // section plus the auto-opening lead popup). Field ids are suffixed with a
  // per-instance id so labels never collide across instances.
  const uid = useId();
  const fieldId = (field: string) => `quote-${field}-${uid}`;

  const [form, setForm] = useState<FormState>(INITIAL);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isUpgrade = form.userType === "upgrade";

  const update =
    (key: keyof FormState) =>
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  function toggleGoal(goal: string, checked: boolean) {
    setForm((current) => ({
      ...current,
      goals: checked
        ? [...current.goals.filter((value) => value !== goal), goal]
        : current.goals.filter((value) => value !== goal),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Light client-side checks mirroring the backend contract.
    if (form.name.trim().length < 2) {
      setErrorMessage("Please enter your full name (at least 2 characters).");
      setStatus("error");
      return;
    }
    const digits = form.phone.replace(/[^\d]/g, "");
    if (digits.length < 7 || digits.length > 15) {
      setErrorMessage("Please enter a phone number with 7–15 digits.");
      setStatus("error");
      return;
    }
    if (isUpgrade) {
      if (form.goals.length === 0) {
        setErrorMessage(
          "Please choose at least one thing you would like to improve.",
        );
        setStatus("error");
        return;
      }
      if (form.systemNotes.trim().length < 10) {
        setErrorMessage(
          "Please describe your current system or the problem (at least 10 characters).",
        );
        setStatus("error");
        return;
      }
      if (
        !form.inverterUnknown &&
        form.inverterKw.trim() !== "" &&
        (Number.isNaN(Number(form.inverterKw)) || Number(form.inverterKw) <= 0)
      ) {
        setErrorMessage(
          "Inverter capacity must be a positive number of kW — or tick “I’m not sure”.",
        );
        setStatus("error");
        return;
      }
    }

    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/leads/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(form)),
      });

      if (response.status === 201) {
        setStatus("success");
        setForm(INITIAL);
        onSubmitted?.();
        return;
      }

      const body = (await response.json().catch(() => null)) as {
        detail?: unknown;
      } | null;
      setErrorMessage(
        extractErrorDetail(body?.detail) ??
          "Something went wrong. Please try again shortly.",
      );
      setStatus("error");
    } catch {
      setErrorMessage(
        "Could not reach the SUNTECH service. Please check your connection and try again.",
      );
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="flex h-full flex-col items-start justify-center rounded-xl bg-white p-8 shadow-sm"
      >
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-forest-100 text-forest-700">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-6 w-6"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <h3 className="mt-5 text-xl font-bold text-ink-900">
          Request received.
        </h3>
        <p className="mt-2 leading-relaxed text-ink-600">
          We will review your requirements and connect you with a suitable
          installation provider. Keep your phone close — that is how we will
          reach you.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-5 text-sm font-semibold text-forest-700 underline-offset-4 hover:underline"
        >
          Submit another inquiry
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-white p-6 shadow-sm sm:p-8"
      aria-label="Request a solar quote"
    >
      {status === "error" && errorMessage && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {errorMessage}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={fieldId("name")} className={LABEL_CLASSES}>
            Full name <span aria-hidden="true" className="text-red-700">*</span>
          </label>
          <input
            id={fieldId("name")}
            name="name"
            type="text"
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
            value={form.name}
            onChange={update("name")}
            className={`mt-1.5 ${INPUT_CLASSES}`}
            placeholder="e.g. Adamma Okafor"
          />
        </div>

        <div>
          <label htmlFor={fieldId("phone")} className={LABEL_CLASSES}>
            Phone <span aria-hidden="true" className="text-red-700">*</span>
          </label>
          <input
            id={fieldId("phone")}
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            value={form.phone}
            onChange={update("phone")}
            className={`mt-1.5 ${INPUT_CLASSES}`}
            placeholder="e.g. +2348012345678"
          />
        </div>

        <div>
          <label htmlFor={fieldId("email")} className={LABEL_CLASSES}>
            Email <span className="font-normal text-ink-600">(optional)</span>
          </label>
          <input
            id={fieldId("email")}
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={update("email")}
            className={`mt-1.5 ${INPUT_CLASSES}`}
            placeholder="you@example.com"
          />
        </div>

        <fieldset className="sm:col-span-2">
          <legend className={LABEL_CLASSES}>What kind of request is this?</legend>
          <div
            className={`mt-2 gap-2 ${isUpgrade ? "grid grid-cols-1 sm:grid-cols-3" : "grid grid-cols-2"}`}
          >
            {(
              [
                ["residential", "Residential"],
                ["commercial", "Commercial"],
                ["upgrade", "Upgrade an existing system"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-ink-900/15 px-4 py-2.5 text-sm font-semibold text-ink-600 transition-colors has-checked:border-forest-700 has-checked:bg-forest-100 has-checked:text-forest-900"
              >
                <input
                  type="radio"
                  name="userType"
                  value={value}
                  checked={form.userType === value}
                  onChange={update("userType")}
                  className="h-4 w-4 accent-forest-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        {/* ---- Upgrade-specific conditional fields -------------------------- */}
        {isUpgrade && (
          <div className="sm:col-span-2 rounded-xl border border-gold-400/60 bg-gold-300/10 p-5">
            <p className="text-sm leading-relaxed text-ink-900">
              Tell us about the system you already have — the provider will
              use this to prepare an accurate quotation.
            </p>

            <fieldset className="mt-5">
              <legend className={LABEL_CLASSES}>
                What would you like to improve?{" "}
                <span aria-hidden="true" className="text-red-700">*</span>
              </legend>
              <div className="mt-2 grid gap-x-4 gap-y-2 sm:grid-cols-2">
                {IMPROVEMENT_GOALS.map(([value, label]) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-start gap-2.5 rounded-lg py-1 text-sm text-ink-600 has-checked:text-ink-900"
                  >
                    <input
                      type="checkbox"
                      name="improvementGoal"
                      value={value}
                      checked={form.goals.includes(value)}
                      onChange={(event) =>
                        toggleGoal(value, event.target.checked)
                      }
                      className={`${CHECK_CLASS} mt-0.5`}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor={fieldId("inverter-size")} className={LABEL_CLASSES}>
                  Existing inverter capacity (kW){" "}
                  <span className="font-normal text-ink-600">(optional)</span>
                </label>
                <input
                  id={fieldId("inverter-size")}
                  name="inverterKw"
                  type="number"
                  min="0.1"
                  step="any"
                  value={form.inverterKw}
                  onChange={update("inverterKw")}
                  disabled={form.inverterUnknown}
                  aria-disabled={form.inverterUnknown}
                  className={`mt-1.5 ${INPUT_CLASSES}`}
                  placeholder="e.g. 3.5"
                />
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-ink-600">
                  <input
                    type="checkbox"
                    checked={form.inverterUnknown}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        inverterUnknown: event.target.checked,
                      }))
                    }
                    className={CHECK_CLASS}
                  />
                  I don’t know
                </label>
              </div>

              <div>
                <label htmlFor={fieldId("battery-type")} className={LABEL_CLASSES}>
                  Existing battery type{" "}
                  <span className="font-normal text-ink-600">(optional)</span>
                </label>
                <select
                  id={fieldId("battery-type")}
                  name="batteryType"
                  value={form.batteryType}
                  onChange={update("batteryType")}
                  className={`mt-1.5 ${INPUT_CLASSES}`}
                >
                  <option value="">I don’t know</option>
                  {BATTERY_TYPES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor={fieldId("battery-capacity")} className={LABEL_CLASSES}>
                  Existing battery capacity{" "}
                  <span className="font-normal text-ink-600">(optional)</span>
                </label>
                <input
                  id={fieldId("battery-capacity")}
                  name="batteryCapacity"
                  type="text"
                  maxLength={50}
                  value={form.batteryCapacity}
                  onChange={update("batteryCapacity")}
                  disabled={form.batteryCapacityUnknown}
                  aria-disabled={form.batteryCapacityUnknown}
                  className={`mt-1.5 ${INPUT_CLASSES}`}
                  placeholder="e.g. 5 kWh or 100 Ah"
                />
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-ink-600">
                  <input
                    type="checkbox"
                    checked={form.batteryCapacityUnknown}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        batteryCapacityUnknown: event.target.checked,
                      }))
                    }
                    className={CHECK_CLASS}
                  />
                  I don’t know
                </label>
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor={fieldId("system-notes")} className={LABEL_CLASSES}>
                Describe your current system or the problem{" "}
                <span aria-hidden="true" className="text-red-700">*</span>
              </label>
              <textarea
                id={fieldId("system-notes")}
                name="systemNotes"
                rows={4}
                required
                minLength={10}
                maxLength={1000}
                value={form.systemNotes}
                onChange={update("systemNotes")}
                className={`mt-1.5 ${INPUT_CLASSES} resize-y`}
                placeholder="e.g. 5kVA inverter with four panels; batteries run out after one hour at night and the system trips when the freezer starts."
              />
              <p className="mt-1 text-xs text-ink-600">
                {form.systemNotes.trim().length}/1000 characters — what the
                system powers, roughly how old it is, and what is going wrong.
              </p>
            </div>
          </div>
        )}

        <div>
          <label htmlFor={fieldId("city")} className={LABEL_CLASSES}>
            City or area{" "}
            {!isUpgrade && (
              <span className="font-normal text-ink-600">(optional)</span>
            )}
          </label>
          <input
            id={fieldId("city")}
            name="city"
            type="text"
            maxLength={100}
            required={isUpgrade}
            value={form.city}
            onChange={update("city")}
            className={`mt-1.5 ${INPUT_CLASSES}`}
            placeholder="e.g. Independence Layout, Enugu"
          />
        </div>

        <div>
          <label htmlFor={fieldId("budget")} className={LABEL_CLASSES}>
            Budget range <span className="font-normal text-ink-600">(optional)</span>
          </label>
          <select
            id={fieldId("budget")}
            name="budget"
            value={form.budget}
            onChange={update("budget")}
            className={`mt-1.5 ${INPUT_CLASSES}`}
          >
            <option value="">Not sure yet</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {!isUpgrade && (
          <div className="sm:col-span-2">
            <label htmlFor={fieldId("size")} className={LABEL_CLASSES}>
              Intended system size (kW){" "}
              <span className="font-normal text-ink-600">(optional)</span>
            </label>
            <input
              id={fieldId("size")}
              name="systemSize"
              type="number"
              min="0.01"
              step="any"
              value={form.systemSize}
              onChange={update("systemSize")}
              className={`mt-1.5 ${INPUT_CLASSES}`}
              placeholder="e.g. 3.5"
            />
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-gold-300 px-6 py-3 text-base font-semibold text-forest-950 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? "Submitting…" : "Get a Solar Quote"}
      </button>
    </form>
  );
}
