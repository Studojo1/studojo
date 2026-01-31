import { motion } from "framer-motion";
import { Footer, Header } from "~/components";
import { CareersApplyForm } from "~/components/careers/apply-form";
import type { Route } from "./+types/apply";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Careers Apply – Studojo" },
    {
      name: "description",
      content:
        "Share your details so we can curate the best opportunities for your profile.",
    },
  ];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export default function CareersApply() {
  return (
    <>
      <Header />
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full bg-white"
      >
        {/* Hero Section */}
        <motion.section variants={sectionVariants} className="w-full">
          <div className="relative flex min-h-[420px] w-full flex-col items-center justify-center gap-6 rounded-b-2xl bg-emerald-500 px-4 py-16 md:min-h-[400px] md:gap-8 md:py-20">
            <div className="relative z-10 flex flex-col items-center gap-6 text-center md:gap-8">
              <div className="rounded-full bg-white/20 px-4 py-2 shadow-sm">
                <span className="font-['Satoshi'] text-sm font-normal leading-5 text-white">
                  Only 10 spots left for this batch
                </span>
              </div>
              <h1 className="max-w-xl font-['Clash_Display'] text-3xl font-medium leading-tight tracking-tight text-white md:text-4xl lg:text-5xl">
                We want to understand you better
              </h1>
              <p className="max-w-2xl font-['Satoshi'] text-sm font-normal leading-6 text-white/90 md:text-base md:leading-7">
                Share your details so we can curate the best opportunities for your profile.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Video Section */}
        <motion.section variants={sectionVariants} className="w-full bg-white py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-4 md:px-8">
            <div className="rounded-2xl border-2 border-neutral-900 bg-white p-4 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] md:rounded-3xl md:p-6 md:shadow-[6px_6px_0px_0px_rgba(25,26,35,1)]">
              <video
                className="w-full rounded-xl"
                controls
                playsInline
                preload="metadata"
              >
                <source src="/videos/internship.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </motion.section>

        {/* Why this matters section */}
        <motion.section variants={sectionVariants} className="w-full bg-white py-12 md:py-16">
          <div className="mx-auto max-w-[var(--section-max-width)] px-4 md:px-8">
            <div className="mb-8 text-center">
              <h2 className="font-['Clash_Display'] text-2xl font-medium leading-8 tracking-tight text-neutral-950 md:text-3xl">
                Why this matters
              </h2>
            </div>
            <ul className="mx-auto grid max-w-3xl gap-4 md:grid-cols-3 md:gap-6">
              {[
                "Personalized career roadmap tailored to your interests",
                "Exclusive access to premium internship listings",
                "Priority support from our career mentors",
              ].map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 outline outline-2 outline-emerald-200"
                >
                  <svg
                    className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="font-['Satoshi'] text-sm font-normal leading-6 text-neutral-950 md:text-base">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </motion.section>

        {/* Form Section */}
        <motion.section variants={sectionVariants} className="w-full bg-white py-12 md:py-16">
          <div className="mx-auto max-w-3xl px-4 md:px-8">
            <CareersApplyForm />
          </div>
        </motion.section>

        <motion.div variants={sectionVariants}>
          <Footer />
        </motion.div>
      </motion.main>
    </>
  );
}

