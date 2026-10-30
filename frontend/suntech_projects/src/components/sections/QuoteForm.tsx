import { useState, type FormEvent } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") ?? "";

type Status = "idle" | "submitting" | "success" | "error";

interface FormState {
  name: string;
  email: string;
  phone: string;
  userType: "residential" | "commercial";
  city: string;
  budget: "" | "low" | "medium" | "high";
  systemSize: string;
}

const INITIAL: FormState = {
  name: "",
  email: "",
  phone: "",
  userType: "residential",
  city: "",
  budget: "",
  systemSize: "",
};

/** Mirrors LeadCreate on the backend (status/notes/timestamps are system-managed). */
function toPayload(form: FormState) {
  return {
    name: form.name.trim(),
    email: form.email.trim() === "" ? undefined : form.email.trim(),
    phone: form.phone,
    user_type: form.userType,
    city: form.city.trim() === "" ? undefined : form.city.trim(),
    budget_range: form.budget === "" ? undefined : form.budget,
    system_size_kw:
      form.systemSize.trim() === "" ? undefined : Number(form.systemSize),
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
  "w-full rounded-lg border border-ink-900/15 bg-white px-4 py-2.5 text-base text-ink-900 placeholder:text-ink-600/50 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20";

const LABEL_CLASSES = "block text-sm font-semibold text-ink-900";

export function QuoteForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const update =
    (key: keyof FormState) =>
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement
      >,
    ) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

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
          <label htmlFor="quote-name" className={LABEL_CLASSES}>
            Full name <span aria-hidden="true" className="text-red-700">*</span>
          </label>
          <input
            id="quote-name"
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
          <label htmlFor="quote-phone" className={LABEL_CLASSES}>
            Phone <span aria-hidden="true" className="text-red-700">*</span>
          </label>
          <input
            id="quote-phone"
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
          <label htmlFor="quote-email" className={LABEL_CLASSES}>
            Email <span className="font-normal text-ink-600">(optional)</span>
          </label>
          <input
            id="quote-email"
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
          <legend className={LABEL_CLASSES}>What kind of property is it?</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                ["residential", "Residential"],
                ["commercial", "Commercial"],
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

        <div>
          <label htmlFor="quote-city" className={LABEL_CLASSES}>
            City or area <span className="font-normal text-ink-600">(optional)</span>
          </label>
          <input
            id="quote-city"
            name="city"
            type="text"
            maxLength={100}
            value={form.city}
            onChange={update("city")}
            className={`mt-1.5 ${INPUT_CLASSES}`}
            placeholder="e.g. Independence Layout, Enugu"
          />
        </div>

        <div>
          <label htmlFor="quote-budget" className={LABEL_CLASSES}>
            Budget range <span className="font-normal text-ink-600">(optional)</span>
          </label>
          <select
            id="quote-budget"
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

        <div className="sm:col-span-2">
          <label htmlFor="quote-size" className={LABEL_CLASSES}>
            Intended system size (kW){" "}
            <span className="font-normal text-ink-600">(optional)</span>
          </label>
          <input
            id="quote-size"
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
