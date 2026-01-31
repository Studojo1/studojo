import { Link } from "react-router";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className ?? ""}`}
      aria-hidden
    >
      <path
        d="M16.667 5L7.5 14.167 3.333 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const PLANS = [
  {
    id: "free",
    label: "Free",
    price: "₹0",
    period: "/month",
    features: [
      "Resume builder (unlimited)",
      "Study rooms",
      "Basic notes generation",
    ],
    cta: "Get Started",
    ctaClass:
      "bg-neutral-100 border-2 border-neutral-900 rounded-2xl text-neutral-900 font-['Satoshi'] font-medium",
    popular: false,
  },
  {
    id: "pay-per-use",
    label: "Pay per Use",
    price: "₹299",
    period: "/assignment",
    features: [
      "Everything in Free",
      "Full assignment generation",
      "Humanizer & formatter tools",
      "Advanced exam prep",
    ],
    cta: "Try Assignment Dojo",
    ctaClass:
      "bg-purple-500 border-2 border-neutral-900 rounded-2xl text-white font-['Satoshi'] font-medium",
    popular: true,
  },
  {
    id: "pro",
    label: "Pro",
    price: "₹999",
    period: "/month",
    features: [
      "Everything in Pay per Use",
      "Unlimited assignments",
      "Priority support",
      "Early access to features",
    ],
    cta: "Go Pro",
    ctaClass:
      "bg-neutral-900 border-2 border-neutral-900 rounded-2xl text-white font-['Satoshi'] font-medium",
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="scroll-mt-24 border-b border-neutral-900 bg-purple-50 px-4 pt-8 pb-8 md:bg-white md:px-8 md:py-24"
    >
      <div className="mx-auto max-w-[var(--section-max-width)]">
        <div className="mb-8 text-center md:mb-16">
          <div className="mb-4 flex flex-col items-center gap-2 md:mb-0 md:gap-0">
            <h2 className="font-['Clash_Display'] text-lg font-medium leading-7 text-neutral-900 md:text-3xl md:leading-8 lg:text-4xl">
              Simple{" "}
              <span className="inline-flex rounded-2xl border-2 border-neutral-900 bg-purple-300 px-3 py-1 font-['Satoshi'] text-base font-medium leading-6 text-neutral-900 md:py-2 md:text-lg md:leading-8">
                pricing
              </span>
            </h2>
          </div>
          <p className="mx-auto mt-4 max-w-2xl font-['Satoshi'] text-base font-normal leading-6 text-neutral-700 md:text-xl md:leading-7">
            Pay only for what you use. No hidden fees.
          </p>
        </div>

        <div className="relative flex flex-col gap-8 md:grid md:grid-cols-3">
          {PLANS.map((plan) => {
            const isPopular = plan.popular;
            
            return (
              <article
                key={plan.id}
                className={`relative flex flex-col gap-6 rounded-3xl border-2 border-neutral-900 p-6 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] md:rounded-[40px] md:p-8 md:shadow-[6px_6px_0px_0px_rgba(25,26,35,1)] ${
                  isPopular
                    ? "bg-violet-500 md:bg-gradient-to-br md:from-purple-100 md:to-blue-100"
                    : "bg-white"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border-2 border-neutral-900 bg-yellow-500 px-4 py-1.5 shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] md:-top-3.5 md:py-2.5 md:shadow-[3px_3px_0px_0px_rgba(25,26,35,1)]">
                    <span className="font-['Satoshi'] text-xs font-medium leading-4 text-neutral-900 md:text-sm md:font-black md:leading-5 md:text-white">
                      POPULAR
                    </span>
                  </div>
                )}
                <p className={`font-['Satoshi'] text-sm font-normal leading-5 md:text-lg md:font-medium md:leading-7 ${
                  isPopular ? "text-white md:text-neutral-900" : "text-neutral-700 md:text-neutral-900"
                }`}>
                  {plan.label}
                </p>
                <div className="flex flex-col gap-2">
                  <p className="flex items-baseline gap-1">
                    <span className={`font-['Clash_Display'] text-4xl font-semibold leading-[54px] tracking-tight md:leading-10 ${
                      isPopular ? "text-white md:text-neutral-900" : "text-neutral-900"
                    }`}>
                      {plan.price}
                    </span>
                  </p>
                  <p className={`font-['Satoshi'] text-sm font-normal leading-5 md:text-base md:leading-6 ${
                    isPopular ? "text-purple-100 md:text-neutral-600" : "text-neutral-700 md:text-neutral-600"
                  }`}>
                    {plan.id === "free" ? "Perfect for trying out" : plan.period}
                  </p>
                </div>
                <ul className="flex flex-1 flex-col gap-3" role="list">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className={`flex items-start gap-2 font-['Satoshi'] text-sm font-normal leading-5 md:text-base md:leading-6 ${
                        isPopular ? "text-white md:text-neutral-700" : "text-neutral-900 md:text-neutral-700"
                      }`}
                    >
                      <CheckIcon className={`mt-1 h-5 w-5 md:h-6 md:w-6 ${
                        isPopular ? "text-white md:text-emerald-600" : "text-neutral-900 md:text-emerald-600"
                      }`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.id === "pay-per-use" ? "#dojos" : "/auth?mode=signup"}
                  className={`block w-full py-3 text-center text-base rounded-2xl border-2 border-neutral-900 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] font-['Satoshi'] font-medium transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none ${
                    isPopular
                      ? "bg-white text-violet-500"
                      : plan.ctaClass
                  }`}
                >
                  {plan.cta}
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
