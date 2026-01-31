import { Section } from "../common/section";

const defaultText =
  "Assignments, resumes, exam prep—all in one place. No tutorials needed. Just pick what you need and get it done.";

type ValuePropSectionProps = {
  text?: string;
};

export function ValuePropSection({ text = defaultText }: ValuePropSectionProps) {
  return (
    <Section
      width="narrow"
      className="bg-[var(--color-studojo-surface-muted)] rounded-2xl max-md:rounded-xl"
    >
      <p className="font-sans text-[var(--color-studojo-ink)] text-center max-md:text-left text-[var(--font-size-value-prop-mobile)] md:text-[var(--font-size-value-prop)] leading-relaxed">
        {text}
      </p>
    </Section>
  );
}
