interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  /** "light" = for dark backgrounds, "dark" = for light backgrounds. */
  tone?: "light" | "dark";
  align?: "left" | "center";
  className?: string;
}

/** Consistent eyebrow + title + optional lead-in for every section. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  tone = "dark",
  align = "left",
  className = "",
}: SectionHeadingProps) {
  const alignment = align === "center" ? "text-center" : "text-left";
  const eyebrowColor = tone === "dark" ? "text-forest-700" : "text-gold-300";
  const titleColor = tone === "dark" ? "text-ink-900" : "text-white";
  const descriptionColor = tone === "dark" ? "text-ink-600" : "text-white/75";

  return (
    <div className={`${alignment} ${className}`}>
      <p
        className={`text-xs font-semibold uppercase tracking-[0.22em] ${eyebrowColor}`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-3 text-3xl font-bold tracking-tight sm:text-4xl ${titleColor}`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 max-w-2xl text-lg leading-relaxed ${descriptionColor} ${
            align === "center" ? "mx-auto" : ""
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
