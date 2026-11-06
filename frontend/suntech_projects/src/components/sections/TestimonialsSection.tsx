/**
 * Testimonials section — "Trusted by People Who Choose Better Power".
 *
 * Supports verified customer feedback (name, location, project type,
 * optional photo). While `TESTIMONIALS` is empty it renders a
 * trust-focused fallback instead of fake reviews, in line with the
 * brand's honesty positioning.
 */

import { useEffect, useState } from "react";

import {
  TESTIMONIALS,
  TESTIMONIALS_EYEBROW,
  TESTIMONIALS_HEADING,
  TESTIMONIALS_PLACEHOLDER_LEAD,
  TESTIMONIALS_PLACEHOLDER_POINTS,
  type Testimonial,
} from "../../data/content";
import { apiUrl } from "../../api/session";
import type { TestimonialPublic } from "../../types/admin";
import { Container } from "../ui/Container";
import { Reveal } from "../ui/Reveal";
import { SectionHeading } from "../ui/SectionHeading";

/** Pulls verified (approved) stories from the backend. */
function useVerifiedTestimonials(): Testimonial[] {
  const [verified, setVerified] = useState<Testimonial[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl("/api/v1/testimonials/public"))
      .then((response) => {
        if (!response.ok) return [];
        return response.json() as Promise<TestimonialPublic[]>;
      })
      .then((entries) => {
        if (cancelled) return;
        setVerified(
          entries.map((entry) => ({
            name: entry.name,
            location: entry.location,
            projectType: entry.project_type,
            quote: entry.quote,
            photoUrl: entry.photo_path ? apiUrl(entry.photo_path) : undefined,
          })),
        );
      })
      .catch(() => {
        // Network/DB issues fall back to the trust block — never fake data.
        if (!cancelled) setVerified([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return verified;
}

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function CheckIcon() {
  return (
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
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="flex h-full flex-col rounded-xl border border-ink-900/10 bg-white p-6">
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className="h-6 w-6 text-gold-400"
      >
        <path d="M7.2 6C4.9 7.6 3.5 10 3.5 13.1c0 3 1.9 4.9 4.2 4.9 2 0 3.6-1.5 3.6-3.6 0-2-1.4-3.4-3.3-3.4-.4 0-.8 0-1.1.2.4-1.6 1.7-3 3.2-4L7.2 6zm9.6 0c-2.3 1.6-3.7 4-3.7 7.1 0 3 1.9 4.9 4.2 4.9 2 0 3.6-1.5 3.6-3.6 0-2-1.4-3.4-3.3-3.4-.4 0-.8 0-1.1.2.4-1.6 1.7-3 3.2-4L16.8 6z" />
      </svg>
      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink-900">
        {testimonial.quote}
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-ink-900/10 pt-4">
        {testimonial.photoUrl ? (
          <img
            src={testimonial.photoUrl}
            alt={`Photograph of ${testimonial.name}`}
            loading="lazy"
            decoding="async"
            className="h-11 w-11 shrink-0 rounded-full border border-ink-900/10 object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-100 text-sm font-extrabold text-forest-800"
          >
            {initialsFor(testimonial.name)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink-900">{testimonial.name}</p>
          <p className="truncate text-xs text-ink-600">{testimonial.location}</p>
          <p className="mt-1 flex">
            <span className="inline-block rounded-md border border-forest-300 bg-forest-100 px-2 py-0.5 text-[0.7rem] font-semibold text-forest-800">
              {testimonial.projectType}
            </span>
          </p>
        </div>
      </figcaption>
    </figure>
  );
}

export function TestimonialsSection() {
  const verified = useVerifiedTestimonials();
  const hasTestimonials = TESTIMONIALS.length > 0 || verified.length > 0;
  // Content-curated entries win over fetched ones, and fetched entries
  // keep their /media photo URLs.
  const displayed: Testimonial[] = TESTIMONIALS.length > 0 ? TESTIMONIALS : verified;

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-title"
      className="bg-sand-100 py-16 lg:py-24"
    >
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={TESTIMONIALS_EYEBROW}
            title={TESTIMONIALS_HEADING}
            description={
              hasTestimonials
                ? "Real words from people who asked us for better power — reviewed and verified before publishing."
                : TESTIMONIALS_PLACEHOLDER_LEAD
            }
          />
        </Reveal>

        {hasTestimonials ? (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {displayed.map((testimonial, index) => (
              <Reveal key={testimonial.name} delay={index * 120} className="h-full">
                <TestimonialCard testimonial={testimonial} />
              </Reveal>
            ))}
          </div>
        ) : (
          /* Temporary trust-focused block until verified reviews exist. */
          <Reveal delay={120}>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {TESTIMONIALS_PLACEHOLDER_POINTS.map((point) => (
                <div
                  key={point}
                  className="rounded-xl border border-ink-900/10 bg-white p-6"
                >
                  <ul className="space-y-2.5">
                    <li className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-900">
                      <CheckIcon />
                      {point}
                    </li>
                  </ul>
                  <span className="sr-only">Temporary trust statement</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-ink-600">
              Verified customer stories will be published here — none are
              shown until they are real.
            </p>
          </Reveal>
        )}
      </Container>
    </section>
  );
}
