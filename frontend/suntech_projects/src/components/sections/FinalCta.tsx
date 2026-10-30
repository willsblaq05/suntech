import { FINAL_CTA } from "../../data/content";
import { Container } from "../ui/Container";
import { Reveal } from "../ui/Reveal";
import { QuoteForm } from "./QuoteForm";

export function FinalCta() {
  return (
    <section id="get-a-quote" className="scroll-mt-24 bg-forest-950 py-16 lg:py-24">
      <Container>
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-300">
              GET A SOLAR QUOTE
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {FINAL_CTA.title}
            </h2>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-white/75">
              {FINAL_CTA.body}
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Reviewed by our team before we connect you",
                "You discuss your requirements and budget directly with the provider",
                "Quotations come from the provider — not from us",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-white/80">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="mt-1 h-4 w-4 shrink-0 text-gold-300"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={140}>
            <QuoteForm />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
