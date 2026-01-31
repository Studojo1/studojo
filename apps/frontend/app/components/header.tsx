import { motion } from "framer-motion";
import { useState } from "react";
import { Link, useLocation } from "react-router";

const NAV_LINKS = [
  { to: "/", label: "Home", active: true },
  { to: "#dojos", label: "Features" },
  { to: "#dojos", label: "Dojos" },
  { to: "#pricing", label: "Pricing" },
  { to: "#reviews", label: "Reviews" },
] as const;

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <motion.header
      className="sticky top-0 z-50 w-full border-b border-neutral-900 bg-white"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="mx-auto flex h-16 max-w-[var(--section-max-width)] items-center justify-between px-4 pt-4 pb-px md:h-24 md:px-8 md:pt-0 md:pb-0">
        <Link
          to="/"
          className="font-['Satoshi'] text-2xl font-black leading-9 text-neutral-900 md:text-4xl md:leading-7"
        >
          studojo
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className={`font-['Satoshi'] text-base leading-6 ${
                "active" in link && link.active
                  ? "font-black text-neutral-700"
                  : "font-normal text-neutral-700"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            to="/auth?mode=signin"
            className="hidden font-['Satoshi'] text-base font-medium leading-6 text-neutral-700 sm:block"
          >
            Sign In
          </Link>
          <Link
            to="/auth?mode=signup"
            className={`flex h-12 flex-1 items-center justify-center rounded-2xl bg-neutral-900 font-['Satoshi'] text-base font-medium leading-6 text-white transition-transform hover:translate-x-[2px] hover:translate-y-[2px] md:w-32 md:flex-none ${
              isHomePage ? "hidden md:flex" : ""
            }`}
          >
            Get Started
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-900 hover:bg-neutral-100 md:hidden"
            aria-expanded={mobileOpen}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          className="border-t border-neutral-200 bg-white px-8 py-4 md:hidden"
          aria-label="Mobile menu"
        >
          <ul className="flex flex-col gap-2">
            {NAV_LINKS.map(({ to, label }) => (
              <li key={label}>
                <Link
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg py-2 font-['Satoshi'] text-neutral-700 hover:bg-neutral-50"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </motion.header>
  );
}
