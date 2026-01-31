import type { ReactNode } from "react";

type SectionProps = {
  children: ReactNode;
  /** Optional className for layout overrides */
  className?: string;
  /** Optional id for anchor links */
  id?: string;
  /** Semantic HTML section variant */
  as?: "section" | "div" | "main";
  /** Constrain width */
  width?: "default" | "narrow" | "wide" | "full";
};

const widthClasses = {
  default: "max-w-[var(--section-max-width)]",
  narrow: "max-w-2xl",
  wide: "max-w-6xl",
  full: "max-w-none",
} as const;

export function Section({
  children,
  className = "",
  id,
  as: Component = "section",
  width = "default",
}: SectionProps) {
  return (
    <Component
      id={id}
      className={[
        "mx-auto w-full px-[var(--section-padding-x)]",
        "py-[var(--section-padding-y-mobile)] md:py-[var(--section-padding-y)]",
        id && "scroll-mt-20",
        widthClasses[width],
        className,
      ].join(" ")}
    >
      {children}
    </Component>
  );
}
