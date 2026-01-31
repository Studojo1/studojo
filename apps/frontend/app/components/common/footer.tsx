import { Link } from "react-router";
import { FiBookOpen, FiTarget, FiMail, FiMapPin } from "react-icons/fi";
import { IoBriefcaseOutline } from "react-icons/io5";
import { FaXTwitter, FaInstagram, FaWhatsapp } from "react-icons/fa6";
import { SmoothLink } from "./smooth-link";
import { FaLinkedin } from "react-icons/fa6";

const COMPANY_LINKS = [
  { to: "/about", label: "About Us" },
  { to: "/blog", label: "Blog" },
  // { to: "/press-kit", label: "Press Kit" },
];

const RESOURCE_LINKS = [
  { to: "mailto:admin@studojo.com", label: "Help Center" },
  { to: "https://chat.whatsapp.com/CUV8DSjQWqB82yXKRE66ol?mode=gi_t", label: "Community" },
];

const DOJO_LINKS = [
  { to: "/dojos/assignment", label: "Assignment Dojo", desc: "Master your assignments", stat: "10k+ completed", color: "bg-violet-500", icon: <FiBookOpen /> },
  { to: "/dojos/careers", label: "Careers Dojo", desc: "Build your career path", stat: "5k+ resumes", color: "bg-emerald-500", icon: <IoBriefcaseOutline /> },
  { to: "#dojos", label: "Revision Dojo", desc: "Ace your exams", stat: "15k+ students", color: "bg-amber-500", icon: <FiTarget />, comingSoon: true },
];

const SOCIAL_LINKS = [
  { 
    href: "https://www.linkedin.com/company/studojo/", 
    label: "LinkedIns", 
    icon: <FaLinkedin />,
    ariaLabel: "Follow us on LinkedIn"
  },
  { 
    href: "https://instagram.com/studojo", 
    label: "Instagram", 
    icon: <FaInstagram />,
    ariaLabel: "Follow us on Instagram"
  },
  { 
    href: "https://chat.whatsapp.com/CUV8DSjQWqB82yXKRE66ol?mode=gi_t", 
    label: "WhatsApp", 
    icon: <FaWhatsapp />,
    ariaLabel: "Join our WhatsApp group"
  },
];

export function Footer() {
  return (
    <footer
      id="resources"
      className="relative scroll-mt-24 overflow-hidden border-b border-neutral-900 bg-white"
    >
      <div className="relative mx-auto max-w-[var(--section-max-width)] px-4 pt-8 md:px-8 md:py-24">
        <div className="flex flex-col gap-8 md:grid md:grid-cols-2 md:gap-16 lg:gap-12">
          {/* Left: branding, newsletter, contact */}
          <div className="flex flex-col gap-8 md:gap-12">
            <div className="flex flex-col gap-4 md:gap-6">
              <div>
                <Link
                  to="/"
                  className="font-['Satoshi'] text-2xl font-black leading-9 tracking-tight text-neutral-900 md:text-3xl"
                >
                  studojo
                </Link>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-gray-300 bg-white p-6 md:rounded-3xl md:border-black/20 md:bg-purple-50 md:gap-4 md:p-8">
              <h3 className="font-['Clash_Display'] text-lg font-medium leading-7 text-neutral-950 md:text-2xl">
                Join the Dojo
              </h3>
              <p className="font-['Satoshi'] text-sm font-normal leading-5 text-neutral-700 md:text-base md:leading-6 md:text-neutral-900">
                Get weekly wisdom, tips, and exclusive student insights
              </p>
              <form
                className="flex flex-col gap-3 md:flex-row"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  type="email"
                  placeholder="your.email@university.edu"
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-3 font-['Satoshi'] text-sm font-normal text-neutral-950/50 placeholder:text-neutral-950/50 focus:outline-none focus:ring-2 focus:ring-purple-500 md:rounded-2xl md:border-stone-600 md:bg-white/50 md:text-base md:text-neutral-900 md:placeholder:text-neutral-500"
                />
                <button
                  type="submit"
                  className="h-12 rounded-lg bg-violet-500 font-['Satoshi'] text-sm font-medium leading-5 text-white shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] outline outline-[1.58px] outline-offset-[-1.58px] outline-neutral-900 transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(25,26,35,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none md:h-12 md:w-24 md:rounded-2xl md:text-base md:leading-6 md:shadow-none md:outline-none md:hover:translate-x-[2px] md:hover:translate-y-[2px] md:active:translate-x-[4px] md:active:translate-y-[4px]"
                >
                  Join
                </button>
              </form>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-violet-500" aria-hidden>
                  <FiMail />
                </span>
                <span className="font-['Satoshi'] text-sm font-normal leading-5 text-neutral-950 md:text-base md:leading-6">
                   admin@studojo.com
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-violet-500" aria-hidden>
                  <FiMapPin />
                </span>
                <span className="font-['Satoshi'] text-sm font-normal leading-5 text-neutral-950 md:text-base md:leading-6">
                  Bangalore, Karnataka, India
                </span>
              </div>
            </div>
          </div>

          {/* Right: dojos, company, resources */}
          <div className="flex flex-col gap-8">
            <div className="hidden md:block">
              <h3 className="font-['Satoshi'] text-2xl font-black leading-8 tracking-tight text-neutral-900">
                Explore Our Dojos
              </h3>
              <ul className="mt-6 flex flex-col gap-6" role="list">
                {DOJO_LINKS.map(({ to, label, desc, stat, color, icon, comingSoon }) => (
                  <li key={label}>
                    {comingSoon ? (
                      <div className={`flex items-center justify-between rounded-2xl ${color} p-6 opacity-60 cursor-not-allowed`}>
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20" aria-hidden >
                            <span className={`text-2xl text-white`}>
                              {icon}
                            </span>
                          </div>
                          <div>
                            <p className="font-['Clash_Display'] text-2xl font-medium leading-7 text-white">
                              {label}
                            </p>
                            <p className="font-['Satoshi'] text-sm font-normal leading-5 text-white/80">
                              {desc}
                            </p>
                            <p className="font-['Satoshi'] text-xs font-normal leading-4 text-white/60">
                              Coming soon
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : to.startsWith("#") ? (
                      <SmoothLink
                        to={to}
                        className={`flex items-center justify-between rounded-2xl ${color} p-6 transition opacity-90 hover:opacity-100`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20" aria-hidden >
                            <span className={`text-2xl text-white`}>
                              {icon}
                            </span>
                          </div>
                          <div>
                            <p className="font-['Clash_Display'] text-2xl font-medium leading-7 text-white">
                              {label}
                            </p>
                            <p className="font-['Satoshi'] text-sm font-normal leading-5 text-white/80">
                              {desc}
                            </p>
                            <p className="font-['Satoshi'] text-xs font-normal leading-4 text-white/60">
                              {stat}
                            </p>
                          </div>
                        </div>
                        <span className="text-white" aria-hidden>→</span>
                      </SmoothLink>
                    ) : (
                      <Link
                        to={to}
                        className={`flex items-center justify-between rounded-2xl ${color} p-6 transition opacity-90 hover:opacity-100`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20" aria-hidden >
                            <span className={`text-2xl text-white`}>
                              {icon}
                            </span>
                          </div>
                          <div>
                            <p className="font-['Clash_Display'] text-2xl font-medium leading-7 text-white">
                              {label}
                            </p>
                            <p className="font-['Satoshi'] text-sm font-normal leading-5 text-white/80">
                              {desc}
                            </p>
                            <p className="font-['Satoshi'] text-xs font-normal leading-4 text-white/60">
                              {stat}
                            </p>
                          </div>
                        </div>
                        <span className="text-white" aria-hidden>→</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-8 md:gap-8">
              {/* <div>
                <h3 className="font-['Satoshi'] text-xs font-medium leading-4 text-neutral-900 md:text-base md:font-black md:leading-6">
                  About Us
                </h3>
                <ul className="mt-3 flex flex-col gap-2 md:mt-4 md:gap-3" role="list">
                  {COMPANY_LINKS.slice(1).map(({ to, label }) => (
                    <li key={label}>
                      <Link
                        to={to}
                        className="font-['Satoshi'] text-xs font-normal leading-4 text-neutral-700 md:text-base md:leading-6 md:text-neutral-900 hover:underline"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div> */}
              <div>
                <h3 className="font-['Satoshi'] text-xs font-medium leading-4 text-neutral-900 md:text-base md:font-black md:leading-6">
                  Help Center
                </h3>
                <ul className="mt-3 flex flex-col gap-2 md:mt-4 md:gap-3" role="list">
                  {RESOURCE_LINKS.map(({ to, label }) => (
                    <li key={label}>
                      <Link
                        to={to}
                        className="font-['Satoshi'] text-xs font-normal leading-4 text-neutral-700 md:text-base md:leading-6 md:text-neutral-900 hover:underline"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-gray-200 pt-6 md:mt-16 md:border-y md:border-stone-700 md:py-12">
          <div className="flex flex-col items-center gap-4 text-center md:items-center">
            <p className="font-['Satoshi'] text-xs font-normal leading-4 text-neutral-700 md:text-base md:leading-6 md:text-neutral-900">
              Connect with thousands of students reaching their journey
            </p>
            <div className="flex gap-3 md:gap-4">
              {SOCIAL_LINKS.map(({ href, label, icon, ariaLabel }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-violet-500 transition hover:bg-purple-200 md:h-14 md:w-14 md:rounded-2xl md:bg-purple-300 md:text-white md:hover:bg-purple-400"
                  aria-label={ariaLabel}
                >
                  <span className="text-xl">{icon}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-6 md:mt-8 md:flex-row md:border-0 md:pt-0">
          <p className="text-center font-['Satoshi'] text-xs font-normal leading-4 text-neutral-700 md:flex md:items-center md:gap-2 md:text-lg md:leading-6 md:text-neutral-900">
            © 2025 Studojo. Crafted with ❤️ by students
          </p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            <Link to="/privacy" className="font-['Satoshi'] text-xs font-normal leading-4 text-neutral-700 md:text-lg md:leading-5 md:text-neutral-900 hover:underline">
              Privacy Policy
            </Link>
            <Link to="/terms" className="font-['Satoshi'] text-xs font-normal leading-4 text-neutral-700 md:text-lg md:leading-5 md:text-neutral-900 hover:underline">
              Terms of Service
            </Link>
            <Link to="/refund-policy" className="font-['Satoshi'] text-xs font-normal leading-4 text-neutral-700 md:text-lg md:leading-5 md:text-neutral-900 hover:underline">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>

      {/* Massive studojo text at bottom - hidden on mobile */}
      <div className="relative hidden w-full items-center justify-center overflow-hidden pb-8 pt-16 md:flex">
        <span
          className="pointer-events-none select-none font-['Clash_Display'] text-[min(356px,40vw)] font-semibold leading-[0.6] tracking-tight text-purple-50"
          aria-hidden
        >
          studojo
        </span>
      </div>
    </footer>
  );
}
