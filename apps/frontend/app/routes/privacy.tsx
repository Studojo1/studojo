import { Header, Footer } from "~/components";
import { Section } from "~/components/common/section";
import type { Route } from "./+types/privacy";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Privacy Policy – Studojo" },
    {
      name: "description",
      content: "How we protect and handle your data at Studojo",
    },
  ];
}

export default function Privacy() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-neutral-900 bg-purple-50 py-16 md:py-24">
          <Section width="narrow" className="text-center">
            <h1 className="font-['Clash_Display'] text-4xl font-medium leading-tight text-neutral-900 md:text-5xl">
              Privacy Policy
            </h1>
            <p className="mt-4 font-['Satoshi'] text-lg font-normal leading-7 text-neutral-700 md:text-xl">
              How we protect and handle your data
            </p>
          </Section>
        </section>

        {/* Content */}
        <Section width="narrow" className="py-12 md:py-16">
          <div className="space-y-8">
            {/* How We Protect Your Data */}
            <div className="rounded-2xl border-2 border-neutral-900 bg-white p-6 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] md:p-8">
              <h2 className="mb-6 font-['Clash_Display'] text-2xl font-medium leading-7 text-neutral-900 md:text-3xl">
                How We Protect Your Data
              </h2>
              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-purple-50 p-6 md:p-6">
                  <h3 className="mb-3 font-['Clash_Display'] text-xl font-medium leading-7 text-neutral-900 md:text-2xl">
                    No Third-Party Analytics
                  </h3>
                  <p className="font-['Satoshi'] text-sm font-normal leading-6 text-neutral-700 md:text-base">
                    We don't use third-party analytics tools like Google Analytics. Your browsing stays private.
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-purple-50 p-6 md:p-6">
                  <h3 className="mb-3 font-['Clash_Display'] text-xl font-medium leading-7 text-neutral-900 md:text-2xl">
                    No Data Sharing
                  </h3>
                  <p className="font-['Satoshi'] text-sm font-normal leading-6 text-neutral-700 md:text-base">
                    We never share your data with third parties or partners. Your information remains confidential.
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-purple-50 p-6 md:p-6">
                  <h3 className="mb-3 font-['Clash_Display'] text-xl font-medium leading-7 text-neutral-900 md:text-2xl">
                    Secure Cloud Storage
                  </h3>
                  <p className="font-['Satoshi'] text-sm font-normal leading-6 text-neutral-700 md:text-base">
                    Your data lives safely on AWS servers in India (AP-South-1) with MongoDB Atlas with enterprise-grade security.
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-purple-50 p-6 md:p-6">
                  <h3 className="mb-3 font-['Clash_Display'] text-xl font-medium leading-7 text-neutral-900 md:text-2xl">
                    Essential Cookies Only
                  </h3>
                  <p className="font-['Satoshi'] text-sm font-normal leading-6 text-neutral-700 md:text-base">
                    We only use cookies for essential functions like keeping you logged in. No tracking cookies are used.
                  </p>
                </div>
              </div>
            </div>

            {/* Age Requirement */}
            <div className="rounded-2xl border-2 border-neutral-900 bg-white p-6 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] md:p-8">
              <h2 className="mb-6 font-['Clash_Display'] text-2xl font-medium leading-7 text-neutral-900 md:text-3xl">
                Age Requirement
              </h2>
              <div className="rounded-2xl border border-gray-200 bg-purple-50 p-6 text-center md:p-8">
                <p className="font-['Satoshi'] text-lg font-normal leading-7 text-neutral-900 md:text-xl">
                  You must be at least
                </p>
                <p className="my-2 font-['Clash_Display'] text-4xl font-medium leading-tight text-violet-500 md:text-5xl">
                  13
                </p>
                <p className="font-['Satoshi'] text-lg font-normal leading-7 text-neutral-900 md:text-xl">
                  years old to use our platform
                </p>
              </div>
            </div>

            {/* Got Questions */}
            <div className="rounded-2xl border-2 border-neutral-900 bg-white p-6 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] md:p-8">
              <h2 className="mb-6 font-['Clash_Display'] text-2xl font-medium leading-7 text-neutral-900 md:text-3xl">
                Got Questions?
              </h2>
              <div className="rounded-2xl border border-gray-200 bg-purple-50 p-6 text-center md:p-8">
                <p className="mb-4 font-['Satoshi'] text-base font-normal leading-6 text-neutral-700 md:text-lg">
                  If you have any questions about this privacy policy, we'd love to hear from you!
                </p>
                <a
                  href="mailto:admin@studojo.com"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border-2 border-neutral-900 bg-violet-500 px-6 font-['Satoshi'] text-base font-medium leading-6 text-white shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                >
                  Email us: admin@studojo.com
                </a>
              </div>
            </div>

            {/* Your Trust Matters */}
            <div className="rounded-2xl border-2 border-neutral-900 bg-violet-500 p-6 text-center shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] md:p-8">
              <h3 className="mb-4 font-['Clash_Display'] text-2xl font-medium leading-7 text-white md:text-3xl">
                Your Trust Matters
              </h3>
              <p className="font-['Satoshi'] text-base font-normal leading-7 text-white md:text-lg">
                We take your privacy seriously and promise to keep your data safe and secure.
                <br />
                <span className="font-medium">Privacy first, always.</span>
              </p>
            </div>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}



