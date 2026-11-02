/**
 * Admin login — /admin/login.
 *
 * Split-screen on desktop (brand panel + form), single column on mobile.
 * Authenticates against the existing POST /api/v1/auth/token endpoint,
 * which uses the configured ADMIN_USERNAME (not email) — the field is
 * labelled to match, since the backend does not know about email logins.
 */

import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAdminAuth } from "../../auth/useAdminAuth";
import { AdminLoginError, type AuthFailureKind } from "../../api/authAdmin";
import { Wordmark } from "../../components/ui/Wordmark";
import heroImage from "../../assets/solar-hero.svg";

const INPUT_CLASSES =
  "w-full rounded-lg border border-ink-900/15 bg-white px-4 py-2.5 text-base text-ink-900 placeholder:text-ink-600/50 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20";

const FAILURE_MESSAGES: Record<AuthFailureKind, string> = {
  invalid: "Incorrect username or password.",
  locked:
    "The admin account is not configured yet. Set ADMIN_PASSWORD in the backend .env to enable sign-in.",
  network: "Could not reach the SUNTECH service. Please check your connection and try again.",
  server: "Sign-in failed on the server. Please try again shortly.",
};

export function AdminLogin() {
  const auth = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/admin/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validating, setValidating] = useState<string | null>(null);
  const [failure, setFailure] = useState<AuthFailureKind | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (auth.status === "signed-in" || auth.status === "demo") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFailure(null);

    if (username.trim().length === 0) {
      setValidating("Enter your admin username.");
      return;
    }
    if (password.length === 0) {
      setValidating("Enter your password.");
      return;
    }
    setValidating(null);
    setSubmitting(true);

    try {
      await auth.signIn(username.trim(), password);
      navigate(from, { replace: true });
    } catch (error) {
      setFailure(
        error instanceof AdminLoginError ? error.kind : "server",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-sand-100">
      {/* Brand panel — desktop only */}
      <aside className="relative hidden w-1/2 overflow-hidden lg:block">
        <img
          src={heroImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-forest-950/95 via-forest-950/80 to-forest-900/60"
        />
        <div className="relative flex h-full flex-col justify-between p-12">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-gold-300/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-gold-300">
            Admin portal
          </span>
          <div className="max-w-md">
            <h1 className="text-4xl font-extrabold tracking-tight text-white">
              The internal workspace for SUNTECH inquiries.
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-white/75">
              Review every customer inquiry, coordinate with installation
              providers, and keep the referral process moving.
            </p>
          </div>
          <p className="text-sm text-white/50">Serving Enugu, Nigeria.</p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex w-full flex-col px-6 py-12 sm:px-12 lg:w-1/2 lg:px-20">
        <div className="flex items-center justify-between">
          <Wordmark />
          <a
            href="/"
            className="text-sm font-semibold text-forest-700 underline-offset-4 hover:underline"
          >
            Back to website
          </a>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center pb-24">
          <span className="inline-flex w-fit items-center rounded-full border border-forest-300 bg-forest-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-forest-700 lg:hidden">
            Admin portal
          </span>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink-900 lg:mt-0">
            Welcome back.
          </h2>
          <p className="mt-2 text-ink-600">
            Sign in to manage customer inquiries and solar installation
            requests.
          </p>

          <form onSubmit={handleSubmit} className="mt-8" aria-label="Admin sign in" noValidate>
            {failure && (
              <p
                role="alert"
                className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {FAILURE_MESSAGES[failure]}
                {failure === "network" && (
                  <>
                    {" "}
                    <button
                      type="button"
                      onClick={auth.startDemo}
                      className="font-semibold underline underline-offset-2 hover:text-red-950"
                    >
                      Preview with demo data instead
                    </button>
                  </>
                )}
              </p>
            )}

            <div className="space-y-5">
              <div>
                <label htmlFor="admin-username" className="block text-sm font-semibold text-ink-900">
                  Username
                </label>
                <input
                  id="admin-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  aria-invalid={validating !== null || failure !== null}
                  aria-describedby={validating ? "admin-username-error" : undefined}
                  className={`mt-1.5 ${INPUT_CLASSES}`}
                  placeholder="e.g. admin"
                />
                {validating && (
                  <p id="admin-username-error" className="mt-1.5 text-sm text-red-800">
                    {validating}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="admin-password" className="block text-sm font-semibold text-ink-900">
                  Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="admin-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    aria-invalid={failure !== null}
                    className={`${INPUT_CLASSES} pr-16`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-pressed={showPassword}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-forest-700 transition-colors hover:bg-forest-100"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-forest-900 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-ink-600">
            Access is limited to the SUNTECH operations team. Customer quote
            requests are handled on the{" "}
            <a href="/" className="font-semibold text-forest-700 underline-offset-4 hover:underline">
              public website
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
