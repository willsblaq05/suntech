import type { ReactNode } from "react";

import { SEGMENTS, type Segment } from "../../data/content";
import { Container } from "../ui/Container";
import { Reveal } from "../ui/Reveal";
import { SectionHeading } from "../ui/SectionHeading";

const SEGMENT_ICONS: Record<string, ReactNode> = {
  residential: (
    // house
    <>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </>
  ),
  commercial: (
    // building
    <>
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M10 6h4M10 10h4M10 14h4M10 18h4" />
      <path d="M6 12H4v8a2 2 0 0 0 2 2h2M18 9h2v11a2 2 0 0 1-2 2h-2" />
    </>
  ),
};

function SegmentCard({ segment, index }: { segment: Segment; index: number }) {
  return (
    <Reveal delay={index * 120} className="h-full">
      <article
        id={segment.id}
        className="flex h-full scroll-mt-24 flex-col rounded-xl border border-ink-900/10 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      >
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-forest-900 text-gold-300">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-6 w-6"
          >
            {SEGMENT_ICONS[segment.id]}
          </svg>
        </span>
        <h3 className="mt-5 text-2xl font-bold tracking-tight text-ink-900">
          {segment.title}
        </h3>
        <p className="mt-3 flex-1 leading-relaxed text-ink-600">{segment.body}</p>
        <a
          href="#get-a-quote"
          className="group mt-6 inline-flex items-center gap-2 text-sm font-semibold text-forest-700 transition-colors hover:text-forest-900"
        >
          {segment.ctaLabel}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </article>
    </Reveal>
  );
}

export function SegmentCards() {
  return (
    <section
      aria-label="Customer segments"
      className="bg-sand-100 py-16 lg:py-24"
    >
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="WHO WE SERVE"
            title="Solutions for homes and businesses."
            description="Whether you are protecting a household or a business operation, we connect you with a provider suited to the scale of your project."
          />
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {SEGMENTS.map((segment, index) => (
            <SegmentCard key={segment.id} segment={segment} index={index} />
          ))}
        </div>
      </Container>
    </section>
  );
}
