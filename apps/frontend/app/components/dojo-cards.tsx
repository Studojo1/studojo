import { FiBookOpen, FiTarget } from "react-icons/fi";
import { IoBriefcaseOutline } from "react-icons/io5";
import { LuUsersRound } from "react-icons/lu";
import { Link } from "react-router";

type DojoCard = {
  id: string;
  title: string;
  description: string;
  descriptionClass?: string;
  checklist: string[];
  accent: "violet" | "emerald" | "yellow" | "amber";
  cta: string;
  ctaClass: string;
  href?: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
};

const DOJOS: DojoCard[] = [
  {
    id: "assignment",
    title: "Assignment Dojo",
    description:
      "Ace your assignments with AI-powered help. Due soon? We got you.",
    checklist: [
      "Plagiarism-safe content",
      "Properly formatted",
      "References included",
    ],
    accent: "violet",
    cta: "Try it now",
    ctaClass: "text-violet-600",
    icon: <FiBookOpen />,
    href: "/dojos/assignment",
  },
  {
    id: "careers",
    title: "Careers Dojo",
    description:
      "Build a standout resume in minutes. Get placement-ready.",
    descriptionClass: "text-emerald-100",
    checklist: ["ATS optimized", "Professional design", "100% free forever"],
    accent: "emerald",
    cta: "Build resume",
    ctaClass: "text-emerald-600",
    icon: <IoBriefcaseOutline />,
    href: "/dojos/careers",
  },
  {
    id: "revision",
    title: "Revision Dojo",
    description:
      "Study smarter with personalized notes. Exam prep made easy.",
    descriptionClass: "text-amber-100",
    checklist: [
      "Custom study notes",
      "Practice questions",
      "Flashcards & mind maps",
    ],
    accent: "yellow",
    cta: "Coming soon",
    ctaClass: "text-amber-600",
    icon: <FiTarget />,
    comingSoon: true,
  },
  {
    id: "humanizer",
    title: "Humanizer and Formatter Dojo",
    description: "Humanize AI Generated Outcomes.",
    descriptionClass: "text-blue-100",
    checklist: [
      "Untrackable",
      "Against all AI Busters",
      "Generate top tier content",
    ],
    accent: "amber",
    cta: "Coming soon",
    ctaClass: "text-blue-600",
    icon: <LuUsersRound />,
    comingSoon: true,
  },
];

const accentBg: Record<DojoCard["accent"], string> = {
  violet: "bg-violet-500",
  emerald: "bg-emerald-500",
  yellow: "bg-yellow-500",
  amber: "bg-amber-500",
};

const accentIconClass: Record<DojoCard["accent"], string> = {
  violet: "text-violet-500",
  emerald: "text-emerald-500",
  yellow: "text-yellow-500",
  amber: "text-amber-500",
};

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

function ArrowIcon({ className }: { className?: string }) {
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
        d="M4 10h10M10 6l4 4-4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DojoCards() {
  return (
    <section
      id="dojos"
      className="scroll-mt-24 border-b border-neutral-900 bg-white px-4 pt-8 pb-8 md:px-8 md:pt-24 md:pb-16"
    >
      <div className="mx-auto max-w-[var(--section-max-width)]">
        <div className="mb-8 text-center md:mb-16">
          <div className="mb-4 flex flex-col items-center gap-0 md:mb-0 md:gap-0">
            <h2 className="font-['Clash_Display'] text-lg font-medium leading-7 text-neutral-900 md:text-4xl md:leading-8 lg:text-5xl">
              Your personal{" "}
              <span className="inline-flex rounded-2xl border-2 border-neutral-900 bg-emerald-300 px-3 py-1 font-['Satoshi'] text-base font-medium leading-6 text-neutral-900 md:text-2xl md:leading-8">
                dojos
              </span>
            </h2>
          </div>
          <p className="mx-auto mt-4 max-w-2xl font-['Satoshi'] text-base font-normal leading-6 text-neutral-700 md:text-xl md:leading-7">
            Each dojo is designed for one thing: helping you get stuff done,
            fast.
          </p>
        </div>

        <div className="flex flex-col gap-8 md:grid md:grid-cols-2">
          {DOJOS.map((d) => (
            <article
              key={d.id}
              className={`flex flex-col gap-5 rounded-[32px] border-2 border-neutral-900 p-6 shadow-[8px_8px_0px_0px_rgba(25,26,35,1)] md:rounded-[45px] md:p-8 ${accentBg[d.accent]}`}
            >
              <div
                className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-neutral-900 bg-white"
                aria-hidden
              >
                <span className={`text-2xl ${accentIconClass[d.accent]}`}>
                  {d.icon}
                </span>
              </div>
              <h3 className="font-['Clash_Display'] text-3xl font-medium leading-7 text-white">
                {d.title}
              </h3>
              <p
                className={`font-['Satoshi'] text-base font-normal leading-6 text-white md:text-xl md:font-medium md:leading-7 ${d.descriptionClass ?? ""}`}
              >
                {d.description}
              </p>
              <ul className="flex flex-col gap-2" role="list">
                {d.checklist.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 font-['Satoshi'] text-sm font-normal leading-5 text-white md:text-xl md:font-medium md:leading-6"
                  >
                    <CheckIcon className="h-5 w-5 text-white md:h-6 md:w-6" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {d.comingSoon ? (
                <div
                  className={`inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl border-2 border-neutral-900 bg-white/80 px-8 py-3 font-['Satoshi'] text-base font-medium leading-6 opacity-75 md:w-fit ${d.ctaClass}`}
                >
                  {d.cta}
                </div>
              ) : (
                <Link
                  to={d.href ?? "#"}
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-neutral-900 bg-white px-8 py-3 font-['Satoshi'] text-base font-medium leading-6 transition-transform hover:translate-x-[2px] hover:translate-y-[2px] md:w-fit ${d.ctaClass}`}
                >
                  {d.cta}
                  <ArrowIcon className={d.ctaClass} />
                </Link>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
