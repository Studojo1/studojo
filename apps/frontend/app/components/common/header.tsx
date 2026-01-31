import { motion } from "framer-motion";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { authClient } from "~/lib/auth-client";
import { SmoothLink } from "./smooth-link";

const NAV_LINKS = [
  { to: "/", label: "Home", active: true },
  { to: "/blog", label: "Blog" },
  { to: "/dissertation", label: "Dissertations" },
  { to: "/careers", label: "Careers" },
  { to: "#dojos", label: "Dojos" },
  { to: "#reviews", label: "Reviews" },
] as const;

const USER_LINKS = [
  { to: "/resumes", label: "My Resumes" },
  { to: "/settings", label: "Settings" },
] as const;

export function Header() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const { data: session, isPending } = authClient.useSession();

  const handleSignOut = () => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => navigate("/"),
      },
    });
  };

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
          {NAV_LINKS.filter((link) => {
            // Always show non-hash links, only show hash links on home page
            return !link.to.startsWith("#") || isHomePage;
          }).map((link) => {
            const LinkComponent = link.to.startsWith("#") ? SmoothLink : Link;
            return (
              <LinkComponent
                key={link.label}
                to={link.to}
                className={`font-['Satoshi'] text-base leading-6 ${
                  "active" in link && link.active
                    ? "font-black text-neutral-700"
                    : "font-normal text-neutral-700"
                }`}
              >
                {link.label}
              </LinkComponent>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          {!isPending &&
            (session ? (
              <>
                <Link
                  to="/resumes"
                  className="hidden items-center gap-2 font-['Satoshi'] text-base font-medium leading-6 text-neutral-700 hover:text-neutral-900 sm:flex"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>My Resumes</span>
                </Link>
                <Link
                  to="/assignments"
                  className="hidden items-center gap-2 font-['Satoshi'] text-base font-medium leading-6 text-neutral-700 hover:text-neutral-900 sm:flex"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>My Assignments</span>
                </Link>
                <Link
                  to="/settings"
                  className="hidden items-center gap-2 font-['Satoshi'] text-base font-medium leading-6 text-neutral-700 hover:text-neutral-900 sm:flex"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{session.user.name ?? session.user.email}</span>
                </Link>
                <Link
                  to="/settings"
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-700 hover:bg-neutral-100 sm:hidden"
                  aria-label="Settings"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="hidden h-12 w-32 items-center justify-center rounded-2xl border-2 border-neutral-900 bg-white font-['Satoshi'] text-base font-medium leading-6 text-neutral-900 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none md:flex"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth?mode=signin"
                  className="hidden font-['Satoshi'] text-base font-medium leading-6 text-neutral-700 sm:block"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth?mode=signup"
                  className={`flex h-12 items-center justify-center rounded-2xl bg-neutral-900 font-['Satoshi'] text-sm font-medium leading-6 text-white transition-transform hover:translate-x-[2px] hover:translate-y-[2px] px-4 max-w-[120px] flex-shrink-0 md:w-32 md:text-base md:max-w-none ${
                    isHomePage ? "hidden md:flex" : ""
                  }`}
                >
                  Get Started
                </Link>
              </>
            ))}
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
            {NAV_LINKS.filter((link) => {
              // Always show non-hash links, only show hash links on home page
              return !link.to.startsWith("#") || isHomePage;
            }).map(({ to, label }) => {
              const LinkComponent = to.startsWith("#") ? SmoothLink : Link;
              return (
                <li key={label}>
                  <LinkComponent
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg py-2 font-['Satoshi'] text-neutral-700 hover:bg-neutral-50"
                  >
                    {label}
                  </LinkComponent>
                </li>
              );
            })}
            {!isPending &&
              (session ? (
                <>
                  <li>
                    <Link
                      to="/resumes"
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-lg py-2 font-['Satoshi'] text-neutral-700 hover:bg-neutral-50"
                    >
                      My Resumes
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/assignments"
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-lg py-2 font-['Satoshi'] text-neutral-700 hover:bg-neutral-50"
                    >
                      My Assignments
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/settings"
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-lg py-2 font-['Satoshi'] text-neutral-700 hover:bg-neutral-50"
                    >
                      Settings
                    </Link>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        handleSignOut();
                      }}
                      className="block w-full rounded-lg py-2 text-left font-['Satoshi'] text-neutral-700 hover:bg-neutral-50"
                    >
                      Sign out
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link
                      to="/auth?mode=signin"
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-lg py-2 font-['Satoshi'] text-neutral-700 hover:bg-neutral-50"
                    >
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/auth?mode=signup"
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-lg py-2 font-['Satoshi'] text-neutral-700 hover:bg-neutral-50"
                    >
                      Get Started
                    </Link>
                  </li>
                </>
              ))}
          </ul>
        </nav>
      )}
    </motion.header>
  );
}
