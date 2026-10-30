import type { ReactNode } from "react";

type Variant = "gold" | "forest" | "outline-light";
type Size = "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-200";

const VARIANTS: Record<Variant, string> = {
  gold: "bg-gold-300 text-forest-950 hover:bg-gold-400",
  forest: "bg-forest-900 text-white hover:bg-forest-800",
  "outline-light":
    "border border-white/40 text-white hover:border-gold-300 hover:text-gold-300",
};

const SIZES: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export interface ButtonProps {
  /** Renders an anchor when provided; otherwise a button. */
  href?: string;
  type?: "button" | "submit";
  variant?: Variant;
  size?: Size;
  className?: string;
  /** Disables pointer events styling for the anchor variant (menu close). */
  onClick?: () => void;
  "aria-label"?: string;
  children: ReactNode;
}

export function Button({
  href,
  type = "button",
  variant = "gold",
  size = "md",
  className = "",
  onClick,
  children,
  ...rest
}: ButtonProps) {
  const classes = `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`;

  if (href) {
    return (
      <a href={href} onClick={onClick} className={classes} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes} {...rest}>
      {children}
    </button>
  );
}
