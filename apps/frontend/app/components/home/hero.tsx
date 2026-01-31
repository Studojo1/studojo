import { motion } from "framer-motion";
import { Link } from "react-router";
import { SmoothLink } from "~/components";

const floatY = [0, -24, -12, -30, 0];
const floatX = [0, 12, -18, 8, 0];
const floatRotate = [0, 6, -8, 4, 0];

export function Hero() {
  return (
    <section className="overflow-hidden border-b border-neutral-900 bg-purple-50">
      <div className="mx-auto flex max-w-[var(--section-max-width)] flex-col gap-12 px-4 pt-8 pb-8 md:px-8 md:py-20 md:flex-row md:items-center md:justify-between md:gap-16">
        <div className="flex max-w-3xl flex-col gap-5 md:gap-7">
          <div className="flex flex-col items-center gap-3 md:items-start md:gap-0">
            <h1 className="font-['Clash_Display'] text-4xl font-medium leading-10 tracking-tight text-neutral-900 text-center md:text-left md:text-5xl lg:text-6xl">
              Student life made{" "}
              <span className="inline-flex rounded-2xl border-2 border-neutral-900 border-solid bg-purple-300 px-3 py-1 font-['Satoshi'] text-xl font-medium leading-8 tracking-tight text-neutral-900 md:text-3xl lg:text-4xl">
                simple
              </span>
            </h1>
          </div>
          <p className="font-['Satoshi'] text-base font-normal leading-7 text-neutral-700 text-center md:text-left md:text-lg md:max-w-[632px] lg:text-xl">
            Assignments, resumes, exam prep—all in one place. No tutorials needed. Just pick what you need and get it done.
          </p>
          <div className="flex flex-col gap-4 md:flex-row md:flex-wrap">
            <Link
              to="/auth?mode=signup"
              className="inline-flex h-14 w-full items-center justify-center rounded-2xl border-2 border-neutral-900 bg-purple-500 font-['Satoshi'] text-base font-medium leading-6 text-white shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none md:w-auto md:px-10"
            >
              Start for Free
            </Link>
            <SmoothLink
              to="#dojos"
              className="inline-flex h-14 w-full items-center justify-center rounded-2xl border-2 border-neutral-900 bg-white font-['Satoshi'] text-base font-medium leading-6 text-neutral-900 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none md:w-auto md:px-10"
            >
              See How It Works
            </SmoothLink>
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-4 md:flex md:gap-8">
          <motion.div
            className="h-24 w-24 shrink-0 rounded-full border-2 border-neutral-900 bg-yellow-500 shadow-[6px_6px_0px_0px_rgba(25,26,35,1)]"
            aria-hidden
            animate={{
              y: floatY,
              x: floatX,
              rotate: floatRotate,
            }}
            transition={{
              repeat: Infinity,
              repeatType: "reverse",
              duration: 20,
              delay: 0,
            }}
          />
          <motion.div
            className="h-20 w-20 shrink-0 rounded-2xl border-2 border-neutral-900 bg-emerald-300 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)]"
            aria-hidden
            animate={{
              y: floatY,
              x: floatX,
              rotate: floatRotate.map((r) => 12 + r),
            }}
            transition={{
              repeat: Infinity,
              repeatType: "reverse",
              duration: 22,
              delay: 1,
            }}
          />
          <motion.div
            className="h-12 w-12 shrink-0 rounded-2xl border-2 border-neutral-900 bg-violet-500 shadow-[3px_3px_0px_0px_rgba(25,26,35,1)]"
            aria-hidden
            animate={{
              y: floatY,
              x: floatX,
              rotate: floatRotate,
            }}
            transition={{
              repeat: Infinity,
              repeatType: "reverse",
              duration: 18,
              delay: 0.5,
            }}
          />
        </div>
      </div>
    </section>
  );
}
