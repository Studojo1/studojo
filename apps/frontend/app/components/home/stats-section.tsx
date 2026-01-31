import { Section } from "../common/section";
import { StatCard } from "../common/stat-card";

export type StatItem = {
  value: string;
  label: string;
};

const defaultStats: StatItem[] = [
  { value: "10k+", label: "Students helped" },
  { value: "95%", label: "Satisfaction rate" },
  { value: "24/7", label: "Always available" },
];

type StatsSectionProps = {
  stats?: StatItem[];
};

export function StatsSection({ stats = defaultStats }: StatsSectionProps) {
  return (
    <Section
      className="border-b border-neutral-900 bg-white px-4 pt-8 pb-8 md:px-8 md:pt-16 md:pb-16"
      as="section"
    >
      <div className="grid grid-cols-3 justify-center gap-4 md:gap-8 lg:gap-12">
        {stats.map(({ value, label }) => (
          <StatCard key={label} value={value} label={label} />
        ))}
      </div>
    </Section>
  );
}
