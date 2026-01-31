const TESTIMONIALS = [
  {
    id: "1",
    quote:
      "Saved my life during finals week. The assignment generator is insanely good and actually sounds like me.",
    name: "Priya M.",
    meta: "Computer Science, DU",
    avatarClass: "bg-purple-300",
  },
  {
    id: "2",
    quote:
      "The resume builder got me 3 interview calls in one week. And it's FREE. This is crazy good.",
    name: "Rahul K.",
    meta: "MBA, IIM",
    avatarClass: "bg-emerald-300",
  },
  {
    id: "3",
    quote:
      "Finally something that gets how students actually work. No BS, just gets the job done.",
    name: "Sarah D.",
    meta: "Engineering, VIT",
    avatarClass: "bg-amber-400",
  },
];

function StarIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 shrink-0 text-yellow-500"
      aria-hidden
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export function TestimonialsSection() {
  return (
    <section
      id="reviews"
      className="scroll-mt-24 border-b border-neutral-900 bg-white px-4 pt-8 pb-8 md:bg-gradient-to-br md:from-blue-50 md:to-purple-50 md:px-8 md:pt-24 md:pb-16"
    >
      <div className="mx-auto max-w-[var(--section-max-width)]">
        <div className="mb-8 text-center md:mb-16">
          <h2 className="font-['Clash_Display'] text-lg font-medium leading-7 text-neutral-900 md:text-2xl md:leading-8 lg:text-3xl">
            Trusted by students
          </h2>
          <p className="mx-auto mt-2 max-w-2xl font-['Satoshi'] text-base font-normal leading-6 text-neutral-700 md:mt-4 md:text-xl md:leading-7">
            See what students are saying about us
          </p>
        </div>

        <div className="flex flex-col gap-8 md:grid md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <article
              key={t.id}
              className="flex flex-col gap-4 rounded-2xl border-2 border-neutral-900 bg-white p-6 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] md:rounded-[40px] md:gap-5 md:p-8 md:shadow-[6px_6px_0px_0px_rgba(25,26,35,1)]"
            >
              <div className="flex gap-1" aria-hidden>
                {[1, 2, 3, 4, 5].map((i) => (
                  <StarIcon key={i} />
                ))}
              </div>
              <blockquote className="font-['Satoshi'] text-sm font-normal leading-5 text-neutral-900 md:text-base md:leading-6 md:text-neutral-700">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="mt-auto flex items-center gap-3">
                <div
                  className={`h-10 w-10 shrink-0 rounded-full ${t.avatarClass} flex items-center justify-center md:h-12 md:w-12`}
                  aria-hidden
                >
                  <span className="font-['Satoshi'] text-sm font-medium leading-5 text-white">
                    {t.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-['Clash_Display'] text-sm font-medium leading-5 text-neutral-900 md:text-2xl md:leading-6">
                    Anonymous Student
                  </p>
                  <p className="font-['Satoshi'] text-xs font-normal leading-4 text-neutral-700 md:text-base md:leading-6">
                    {t.meta}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
