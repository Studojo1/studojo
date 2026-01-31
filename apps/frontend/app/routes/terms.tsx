import { Header, Footer } from "~/components";
import { Section } from "~/components/common/section";
import type { Route } from "./+types/terms";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Terms & Conditions – Studojo" },
    {
      name: "description",
      content: "Our legal agreement with our users",
    },
  ];
}

export default function Terms() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-neutral-900 bg-purple-50 py-16 md:py-24">
          <Section width="narrow" className="text-center">
            <h1 className="font-['Clash_Display'] text-4xl font-medium leading-tight text-neutral-900 md:text-5xl">
              Terms & Conditions
            </h1>
            <p className="mt-4 font-['Satoshi'] text-lg font-normal leading-7 text-neutral-700 md:text-xl">
              Our legal agreement with our users
            </p>
          </Section>
        </section>

        {/* Content */}
        <Section width="narrow" className="py-12 md:py-16">
          <div className="space-y-8">
            {/* Company Details */}
            <div className="rounded-2xl border-2 border-neutral-900 bg-white p-6 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] md:p-8">
              <h2 className="mb-6 font-['Clash_Display'] text-2xl font-medium leading-7 text-neutral-900 md:text-3xl">
                Company Details
              </h2>
              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-purple-50 p-4 md:p-6">
                  <p className="font-['Satoshi'] text-sm font-normal leading-6 text-neutral-700 md:text-base">
                    <span className="font-medium text-neutral-900">Full Legal Name:</span> Synovate People Solutions Private Limited
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-purple-50 p-4 md:p-6">
                  <p className="font-['Satoshi'] text-sm font-normal leading-6 text-neutral-700 md:text-base">
                    <span className="font-medium text-neutral-900">Registered Address:</span> 305, 2nd Floor, Glory Fields Apartment, Off Central Jail Road, Bengaluru, Bengaluru Urban, Karnataka – 560035
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-purple-50 p-4 md:p-6">
                  <p className="font-['Satoshi'] text-sm font-normal leading-6 text-neutral-700 md:text-base">
                    <span className="font-medium text-neutral-900">Business Structure:</span> Private Limited Company
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-purple-50 p-4 md:p-6">
                  <p className="font-['Satoshi'] text-sm font-normal leading-6 text-neutral-700 md:text-base">
                    <span className="font-medium text-neutral-900">Jurisdiction:</span> India (Karnataka)
                  </p>
                </div>
              </div>
            </div>

            {/* Service Terms */}
            <div className="rounded-2xl border-2 border-neutral-900 bg-white p-6 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] md:p-8">
              <h2 className="mb-6 font-['Clash_Display'] text-2xl font-medium leading-7 text-neutral-900 md:text-3xl">
                Service Terms
              </h2>
              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-purple-50 p-6">
                  <h3 className="mb-3 font-['Clash_Display'] text-xl font-medium leading-7 text-neutral-900 md:text-2xl">
                    Age Requirement
                  </h3>
                  <p className="font-['Satoshi'] text-sm font-normal leading-6 text-neutral-700 md:text-base">
                    You must be at least <span className="font-medium text-neutral-900">13 years old</span> to use our platform.
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-purple-50 p-6">
                  <h3 className="mb-3 font-['Clash_Display'] text-xl font-medium leading-7 text-neutral-900 md:text-2xl">
                    Prohibited Activities
                  </h3>
                  <ul className="list-disc space-y-2 pl-5 font-['Satoshi'] text-sm font-normal leading-6 text-neutral-700 md:text-base">
                    <li>Creating illegal, harmful, or misleading content</li>
                    <li>Attempting to hack or abuse our platform</li>
                    <li>Violating laws or intellectual property rights</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-purple-50 p-6">
                  <h3 className="mb-3 font-['Clash_Display'] text-xl font-medium leading-7 text-neutral-900 md:text-2xl">
                    Service Uptime
                  </h3>
                  <p className="font-['Satoshi'] text-sm font-normal leading-6 text-neutral-700 md:text-base">
                    We aim for <span className="font-medium text-neutral-900">99% uptime</span>! If something goes wrong, we'll let you know via email or platform alerts! 📧
                  </p>
                </div>
              </div>
            </div>

            {/* Intellectual Property */}
            <div className="rounded-2xl border-2 border-neutral-900 bg-white p-6 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] md:p-8">
              <h2 className="mb-6 font-['Clash_Display'] text-2xl font-medium leading-7 text-neutral-900 md:text-3xl">
                Intellectual Property
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-purple-50 p-6">
                  <span className="text-4xl" aria-hidden>👑</span>
                  <p className="font-['Satoshi'] text-sm font-normal leading-6 text-neutral-700 md:text-base">
                    <span className="font-medium text-neutral-900">You own</span> all content generated using our AI tools!
                  </p>
                </div>
                <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-purple-50 p-6">
                  <span className="text-4xl" aria-hidden>💼</span>
                  <p className="font-['Satoshi'] text-sm font-normal leading-6 text-neutral-700 md:text-base">
                    Use your generated content for <span className="font-medium text-neutral-900">commercial purposes</span> without any restrictions!
                  </p>
                </div>
                <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-purple-50 p-6">
                  <span className="text-4xl" aria-hidden>📁</span>
                  <p className="font-['Satoshi'] text-sm font-normal leading-6 text-neutral-700 md:text-base">
                    We <span className="font-medium text-neutral-900">don't claim ownership</span> of your uploaded content. It's all yours!
                  </p>
                </div>
              </div>
            </div>

            {/* Ready to Agree */}
            <div className="rounded-2xl border-2 border-neutral-900 bg-violet-500 p-6 text-center shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] md:p-8">
              <h3 className="mb-4 font-['Clash_Display'] text-2xl font-medium leading-7 text-white md:text-3xl">
                Ready to Agree?
              </h3>
              <p className="font-['Satoshi'] text-base font-normal leading-7 text-white md:text-lg">
                By using our platform, you agree to these terms and conditions.
                <br />
                <span className="font-medium">Let's create something amazing together! 🚀</span>
              </p>
            </div>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}



