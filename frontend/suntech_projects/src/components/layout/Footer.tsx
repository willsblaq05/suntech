import { Container } from "../ui/Container";
import { TAGLINE } from "../../data/content";
import { Wordmark } from "../ui/Wordmark";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-forest-950 py-10">
      <Container className="flex flex-col items-center gap-5 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="space-y-2">
          <Wordmark tone="dark" />
          <p className="text-sm text-white/60">{TAGLINE}</p>
        </div>
        <div className="max-w-sm space-y-2">
          <p className="text-sm text-white/60">
            SUNTECH PROJECTS connects Enugu homeowners and businesses with solar
            installation providers.
          </p>
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} SUNTECH PROJECTS. Serving Enugu, Nigeria.
          </p>
        </div>
      </Container>
    </footer>
  );
}
