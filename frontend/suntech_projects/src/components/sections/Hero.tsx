import { HERO, TAGLINE } from "../../data/content";
import heroImage from "../../assets/solar-hero.svg";
import { Button } from "../ui/Button";
import { Container } from "../ui/Container";
import { Reveal } from "../ui/Reveal";

export function Hero() {
  return (
    <section id="home" className="relative isolate min-h-[600px] lg:h-[88vh]">
      {/* Photograph + legibility scrim */}
      <img
        src={heroImage}
        alt={HERO.alt}
        className="absolute inset-0 -z-10 h-full w-full object-cover"
        loading="eager"
        decoding="async"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-forest-950/95 via-forest-950/70 to-forest-950/20"
      />

      <Container className="flex h-full flex-col justify-center py-24 lg:py-32">
        <Reveal>
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-gold-300">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="h-4 w-4"
            >
              <circle cx="12" cy="12" r="4" fill="currentColor" />
              <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
              </g>
            </svg>
            Suntech Projects · Solar · Enugu, Nigeria
          </p>

          <h1 className="mt-6 max-w-xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]">
            {HERO.title}
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">
            {HERO.body}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button href="#get-a-quote" size="lg">
              Get a Solar Quote
            </Button>
            <Button href="#residential" variant="outline-light" size="lg">
              Explore Solutions
            </Button>
          </div>

          <p className="mt-8 text-sm font-medium tracking-[0.14em] text-white/50">
            {TAGLINE}
          </p>
        </Reveal>
      </Container>

    </section>
  );
}
