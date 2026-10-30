import { STEPS } from "../../data/content";
import { Container } from "../ui/Container";
import { Reveal } from "../ui/Reveal";
import { SectionHeading } from "../ui/SectionHeading";

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 bg-white py-16 lg:py-24"
      aria-label="How it works"
    >
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="HOW IT WORKS"
            title="From inquiry to quotation in four steps."
          />
        </Reveal>

        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <Reveal key={step.title} delay={index * 100} className="h-full">
              <li className="relative h-full rounded-xl border border-ink-900/10 bg-white p-6 transition-shadow duration-300 hover:shadow-lg">
                <span
                  aria-hidden="true"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-gold-300 text-base font-extrabold text-forest-900"
                >
                  {index + 1}
                </span>
                <h3 className="mt-4 text-base font-bold text-ink-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  {step.body}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
