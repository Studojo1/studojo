import { motion } from "framer-motion";

type JobOptimizerToggleProps = {
  checked: boolean;
  onToggle: () => void;
  variant: "desktop" | "mobile";
};

const spring = { type: "spring" as const, stiffness: 500, damping: 35 };

export function JobOptimizerToggle({
  checked,
  onToggle,
  variant,
}: JobOptimizerToggleProps) {
  const isDesktop = variant === "desktop";
  const trackWidth = isDesktop ? 32 : 44; // w-8 | w-11
  const thumbSize = 16; // w-4 h-4
  const padding = 4; // pl-1 pr-1
  const travel = trackWidth - padding * 2 - thumbSize;

  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      className={`relative flex shrink-0 items-center rounded-full overflow-hidden ${
        isDesktop ? "h-5 w-8" : "h-6 w-11"
      } ${checked ? (isDesktop ? "bg-gray-950" : "bg-emerald-500") : "bg-gray-200"}`}
      initial={false}
      animate={{
        backgroundColor: checked
          ? isDesktop
            ? "rgb(23 23 23)"
            : "rgb(16 185 129)"
          : "rgb(229 231 235)",
      }}
      transition={spring}
    >
      <motion.span
        className="absolute top-1/2 rounded-full bg-white"
        style={{
          width: thumbSize,
          height: thumbSize,
          left: padding,
          marginTop: -thumbSize / 2,
        }}
        initial={false}
        animate={{ x: checked ? travel : 0 }}
        transition={spring}
      />
    </motion.button>
  );
}
