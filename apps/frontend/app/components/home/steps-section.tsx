const STEPS = [
  {
    num: "01",
    circleClass: "bg-purple-300",
    title: "Choose your dojo",
    description:
      "Pick what you need help with. Assignment, resume, exam prep, or study session.",
  },
  {
    num: "02",
    circleClass: "bg-emerald-300",
    title: "Answer quick questions",
    description:
      "We'll ask 2-3 questions to personalize everything for you. Super quick.",
  },
  {
    num: "03",
    circleClass: "bg-amber-400",
    title: "Get your result",
    description:
      "High-quality output, ready to use. No editing needed (unless you want to).",
  },
] as const;

export function StepsSection() {
  return (
    <section className="border-b border-neutral-900 bg-white px-4 pt-8 pb-8 md:bg-pink-50 md:px-8 md:pt-24 md:pb-16">
      <div className="mx-auto max-w-[var(--section-max-width)]">
        <div className="mb-8 text-center md:mb-16">
          <h2 className="font-['Clash_Display'] text-3xl font-medium leading-8 text-neutral-900 md:text-4xl">
            So simple, it&apos;s{" "}
            <span className="inline-flex rounded-2xl border-2 border-neutral-900 bg-pink-300 px-3 py-1 font-['Satoshi'] text-lg font-medium leading-8 text-neutral-900">
              actually fun
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-['Satoshi'] text-base font-normal leading-6 text-neutral-700 md:text-xl md:leading-7">
            Three steps. That&apos;s it. No tutorials, no confusion.
          </p>
        </div>

        <div className="flex flex-col gap-8 md:grid md:grid-cols-3">
          {STEPS.map(({ num, circleClass, title, description }) => (
            <div
              key={num}
              className="flex flex-col gap-4 rounded-2xl border-2 border-neutral-900 bg-white p-6 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] md:rounded-[40px] md:p-8 md:shadow-[6px_6px_0px_0px_rgba(25,26,35,1)]"
            >
              <div
                className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-neutral-900 ${circleClass} font-['Satoshi'] text-xl font-black leading-8 tracking-tight text-neutral-900 md:h-16 md:w-16 md:text-2xl`}
                aria-hidden
              >
                {num}
              </div>
              <h3 className="font-['Clash_Display'] text-lg font-medium leading-7 text-neutral-900 md:text-2xl">
                {title}
              </h3>
              <p className="font-['Satoshi'] text-sm font-normal leading-5 text-neutral-700 md:text-base md:leading-6 md:max-w-[14rem]">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
