/**
 * All homepage copy lives here so wording stays consistent and the
 * honesty guardrails ("SUNTECH connects customers with installation
 * providers; it does not install systems itself") are enforced in one place.
 */

export const TAGLINE = "POWERING PROJECTS. BUILDING POSSIBILITIES.";

export interface NavLink {
  label: string;
  href: string;
}

export const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "#home" },
  { label: "Residential Solar", href: "#residential" },
  { label: "Commercial Solar", href: "#commercial" },
  { label: "How It Works", href: "#how-it-works" },
];

export const HERO = {
  alt: "Illustration of solar panels beneath a bright sun",
  title: "Reliable solar power starts with the right provider.",
  body: "SUNTECH PROJECTS helps homeowners and businesses across Enugu understand their requirements and connect with suitable solar installation providers — so you get a quotation that reflects your property and your budget.",
};

export interface TrustPoint {
  title: string;
  body: string;
}

export const TRUST_EYEBROW = "WHY SUNTECH";
export const TRUST_TITLE = "A transparent process, not a sales pitch.";
export const TRUST_LEAD =
  "We are the connection between you and experienced installation providers. Here is exactly how we add value:";

export const TRUST_POINTS: TrustPoint[] = [
  {
    title: "We start with your requirements",
    body: "Tell us what you need — your property type, energy goals and budget — and we use it to understand what a suitable system looks like for you.",
  },
  {
    title: "We review before we refer",
    body: "Every inquiry is reviewed so we can point you toward providers suited to residential or commercial installations like yours.",
  },
  {
    title: "Providers prepare your quotation",
    body: "The installation provider we connect you with assesses your needs on-site and prepares a quotation. No invented numbers, no pressure.",
  },
];

export const WHAT_WE_DO = [
  "Listen to your requirements first",
  "Review every inquiry before referring you",
  "Connect you with a suitable installation provider",
];

export const WHAT_WE_DONT = [
  "Install panels ourselves — our providers do that",
  "Invent testimonials, credentials or numbers",
  "Skip straight to a sales pitch",
];

export interface Segment {
  id: string;
  title: string;
  body: string;
  ctaLabel: string;
}

export const SEGMENTS: Segment[] = [
  {
    id: "residential",
    title: "Residential Solar",
    body: "For homes across Enugu: rooftop systems that can reduce daytime generator reliance and put predictable power behind your household. Tell us about your home and we will connect you with a provider that fits.",
    ctaLabel: "Request a residential quote",
  },
  {
    id: "commercial",
    title: "Commercial Solar",
    body: "For shops, offices, schools and other businesses: scalable installations designed around uptime and running costs. We connect you with providers experienced in commercial-scale projects.",
    ctaLabel: "Request a commercial quote",
  },
];

export interface Step {
  title: string;
  body: string;
}

export const STEPS: Step[] = [
  {
    title: "Tell us what you need",
    body: "Share your property type, energy requirements and budget through our short form.",
  },
  {
    title: "We review your requirements",
    body: "Our team reviews your inquiry to understand what a suitable system looks like.",
  },
  {
    title: "We connect you with a provider",
    body: "We introduce a suitable installation provider for your type of project.",
  },
  {
    title: "Your quotation is prepared",
    body: "The provider assesses your needs and prepares a detailed quotation to discuss with you.",
  },
];

export const FINAL_CTA = {
  title: "Ready to talk solar for your property in Enugu?",
  body: "Request a quotation and we will connect you with a suitable installation provider. You can discuss your requirements — including your budget — directly with them.",
};
