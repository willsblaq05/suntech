import type { ReactNode } from "react";

import {
  TRUST_EYEBROW,
  TRUST_LEAD,
  TRUST_POINTS,
  TRUST_TITLE,
  WHAT_WE_DO,
  WHAT_WE_DONT,
} from "../../data/content";
import { Container } from "../ui/Container";
import { Reveal } from "../ui/Reveal";
import { SectionHeading } from "../ui/SectionHeading";

const ICONS: Record<string, ReactNode> = {
  listen: (
    // speech bubble
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  ),
  review: (
    // magnifier
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
    </>
  ),
  connect: (
    // link
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </>
  ),
};

const ICON_KEYS = ["listen", "review", "connect"] as const;

export function TrustSection() {
  return (
    <section className="bg-white py-16 lg:py-24">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={TRUST_EYEBROW}
            title={TRUST_TITLE}
            description={TRUST_LEAD}
          />
        </Reveal>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {TRUST_POINTS.map((point, index) => (
            <Reveal key={point.title} delay={index * 120}>
              <div className="h-full rounded-xl border border-ink-900/10 bg-white p-6 transition-shadow duration-300 hover:shadow-lg">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-forest-100 text-forest-700">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="h-5 w-5"
                  >
                    {ICONS[ICON_KEYS[index]]}
                  </svg>
                </span>
                <h3 className="mt-4 text-lg font-bold text-ink-900">
                  {point.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  {point.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Honesty strip — states plainly what SUNTECH does and does not do */}
        <Reveal delay={160}>
          <div className="mt-12 grid rounded-xl border border-ink-900/10 bg-sand-100 p-6 sm:grid-cols-2 sm:gap-8 sm:p-8">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-forest-700">
                What we do
              </h3>
              <ul className="mt-4 space-y-2.5">
                {WHAT_WE_DO.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-ink-900">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-forest-600"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-8 sm:mt-0">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-600">
                What we don't do
              </h3>
              <ul className="mt-4 space-y-2.5">
                {WHAT_WE_DONT.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-ink-600">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-ink-600/60"
                    >
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
