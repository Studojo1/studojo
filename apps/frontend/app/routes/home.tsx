import { motion } from "framer-motion";
import { redirect } from "react-router";
import {
  CTABanner,
  DojoCards,
  Footer,
  Header,
  Hero,
  PricingSection,
  StatsSection,
  StepsSection,
  TestimonialsSection,
} from "~/components";
import { getSessionFromRequest, requireOnboardingComplete } from "~/lib/onboarding.server";
import type { Route } from "./+types/home";

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSessionFromRequest(request);
  if (session) {
    const onboardingStatus = await requireOnboardingComplete(session.user.id);
    if (!onboardingStatus.complete) {
      throw redirect("/onboarding");
    }
  }
  return null;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Studojo – Student life made simple" },
    {
      name: "description",
      content:
        "Assignments, projects, exam prep—all in one place. Work smarter, not harder.",
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

export default function Home() {
  return (
    <>
      <Header />
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={sectionVariants}>
          <Hero />
        </motion.div>
        <motion.div variants={sectionVariants}>
          <StatsSection />
        </motion.div>
        <motion.div variants={sectionVariants}>
          <DojoCards />
        </motion.div>
        <motion.div variants={sectionVariants}>
          <StepsSection />
        </motion.div>
        <motion.div variants={sectionVariants}>
          <TestimonialsSection />
        </motion.div>
        <motion.div variants={sectionVariants}>
          <CTABanner />
        </motion.div>
        <motion.div variants={sectionVariants}>
          <Footer />
        </motion.div>
      </motion.main>
    </>
  );
}
