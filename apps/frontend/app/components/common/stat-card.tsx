type StatCardProps = {
  value: string;
  label: string;
};

export function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="flex w-full flex-col items-center gap-1 text-center md:gap-2">
      <span className="font-['Clash_Display'] text-2xl font-bold leading-7 tracking-tight text-neutral-900 md:text-4xl md:leading-[54px] lg:text-5xl">
        {value}
      </span>
      <span className="font-['Satoshi'] text-xs font-normal leading-4 text-neutral-700 md:text-base md:leading-6 lg:text-lg lg:leading-7">
        {label}
      </span>
    </div>
  );
}
