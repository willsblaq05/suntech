import { useState } from "react";

import { NAV_LINKS } from "../../data/content";
import { Button } from "../ui/Button";
import { Container } from "../ui/Container";
import { Wordmark } from "../ui/Wordmark";

export function Navbar() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ink-900/10 bg-white/95 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <a href="#home" aria-label="SUNTECH PROJECTS — home" onClick={closeMenu}>
            <Wordmark />
          </a>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative text-sm font-medium text-ink-600 transition-colors hover:text-forest-800"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:block">
            <Button href="#get-a-quote" variant="gold">
              Get a Solar Quote
            </Button>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-900 transition-colors hover:bg-sand-100 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
              className="h-6 w-6"
            >
              {open ? (
                <path d="M18 6 6 18M6 6l12 12" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </Container>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="border-t border-ink-900/10 bg-white md:hidden"
        >
          <Container className="flex flex-col gap-1 py-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="rounded-lg px-3 py-2.5 text-base font-medium text-ink-900 transition-colors hover:bg-sand-100"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 px-3">
              <Button href="#get-a-quote" onClick={closeMenu} className="w-full">
                Get a Solar Quote
              </Button>
            </div>
          </Container>
        </nav>
      )}
    </header>
  );
}
