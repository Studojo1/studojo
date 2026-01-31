import { Link } from "react-router";
import { Header, Footer } from "~/components";
import { Section } from "~/components/common/section";
import type { Route } from "./+types/refund-policy";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Refund Policy – Studojo" },
    {
      name: "description",
      content: "We want you to be completely satisfied with our services. Please read our refund policy to understand how refunds work at Studojo.",
    },
  ];
}

export default function RefundPolicy() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-neutral-900 bg-purple-50 py-16 md:py-24">
          <Section width="narrow" className="text-center">
            <h1 className="font-['Clash_Display'] text-4xl font-medium leading-tight text-neutral-900 md:text-5xl">
              Refund Policy
            </h1>
            <p className="mt-4 font-['Satoshi'] text-lg font-normal leading-7 text-neutral-700 md:text-xl md:max-w-3xl md:mx-auto">
              We want you to be completely satisfied with our services. Please read our refund policy to understand how refunds work at Studojo.
            </p>
          </Section>
        </section>

        {/* Content */}
        <Section width="wide" className="py-12 md:py-16">
          <div className="space-y-12">
            {/* Our Refund Promise */}
            <section>
              <h2 className="mb-6 font-['Clash_Display'] text-3xl font-medium leading-tight text-neutral-900">
                Our Refund Promise
              </h2>
              <div className="rounded-2xl border-2 border-neutral-900 bg-white p-6 text-center shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] md:p-8">
                <p className="mb-4 font-['Clash_Display'] text-xl font-medium leading-7 text-neutral-900 md:text-2xl">
                  Your satisfaction is our priority.
                </p>
                <p className="font-['Satoshi'] text-sm font-normal leading-6 text-neutral-700 md:text-base">
                  If you're not happy with our services, we offer a refund within the specified period, subject to our terms and conditions.
                </p>
              </div>
            </section>

            {/* Refund Timeframes */}
            <section>
              <h2 className="mb-6 font-['Clash_Display'] text-3xl font-medium leading-tight text-neutral-900">
                Refund Timeframes
              </h2>
              <div className="space-y-4">
                <div className="flex items-center rounded-2xl border-2 border-neutral-900 bg-white p-6 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] md:p-6">
                  <div className="flex-1">
                    <p className="font-['Satoshi'] text-base font-medium leading-6 text-neutral-900 md:text-lg">
                      Assignment Services: <span className="font-normal text-neutral-700">24 hours from purchase</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center rounded-2xl border-2 border-neutral-900 bg-white p-6 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] md:p-6">
                  <div className="flex-1">
                    <p className="font-['Satoshi'] text-base font-medium leading-6 text-neutral-900 md:text-lg">
                      Resume Services: <span className="font-normal text-neutral-700">48 hours from purchase, before final download</span>
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Refund Conditions */}
            <section>
              <h2 className="mb-6 font-['Clash_Display'] text-3xl font-medium leading-tight text-neutral-900">
                Refund Conditions
              </h2>
              <div className="rounded-2xl border-2 border-neutral-900 bg-white p-6 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] md:p-8">
                <ul className="list-disc space-y-4 pl-6 font-['Satoshi'] text-sm font-normal leading-6 text-neutral-700 md:text-base">
                  <li>Refund requests must be made within the specified timeframe for each service</li>
                  <li>For resume services, refunds cannot be processed after the final document has been downloaded</li>
                  <li>Technical issues that prevented service delivery are eligible for full refunds</li>
                  <li>Refunds are processed back to the original payment method</li>
                  <li>Processing time for refunds is typically 5-7 business days</li>
                </ul>
              </div>
            </section>

            {/* How to Request a Refund */}
            <section>
              <h2 className="mb-6 font-['Clash_Display'] text-3xl font-medium leading-tight text-neutral-900">
                How to Request a Refund
              </h2>
              <div className="rounded-2xl border-2 border-neutral-900 bg-white p-6 text-center shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] md:p-8">
                <p className="mb-6 font-['Satoshi'] text-sm font-normal leading-6 text-neutral-700 md:text-base">
                  To request a refund, please contact our support team through the contact form with your order details and reason for the refund.
                </p>
                <p className="font-['Satoshi'] text-sm font-normal leading-6 text-neutral-700 md:text-base">
                  We aim to process all valid refund requests within 48 hours of receiving them.
                </p>
              </div>
            </section>

            {/* Non-Refundable Items */}
            <section>
              <h2 className="mb-6 font-['Clash_Display'] text-3xl font-medium leading-tight text-neutral-900">
                Non-Refundable Items
              </h2>
              <div className="rounded-2xl border-2 border-neutral-900 bg-white p-6 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] md:p-8">
                <p className="mb-6 font-['Satoshi'] text-sm font-normal leading-6 text-neutral-700 md:text-base">
                  The following are not eligible for refunds:
                </p>
                <ul className="list-disc space-y-2 pl-6 font-['Satoshi'] text-sm font-normal leading-6 text-neutral-700 md:text-base">
                  <li>Services where the final product has been delivered and downloaded</li>
                  <li>Services where the refund timeframe has expired</li>
                  <li>Add-on services purchased separately from the main service</li>
                </ul>
              </div>
            </section>

            {/* Action Buttons */}
            <div className="flex flex-col gap-6 md:flex-row">
              <a
                href="mailto:admin@studojo.com"
                className="flex-1"
              >
                <button className="flex w-full items-center justify-center rounded-2xl border-2 border-neutral-900 bg-violet-500 px-6 py-4 font-['Satoshi'] text-base font-medium leading-6 text-white shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">
                  Contact Support for Refund
                </button>
              </a>
              <Link
                to="/"
                className="flex-1"
              >
                <button className="flex w-full items-center justify-center rounded-2xl border-2 border-neutral-900 bg-white px-6 py-4 font-['Satoshi'] text-base font-medium leading-6 text-neutral-900 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">
                  Return to Home
                </button>
              </Link>
            </div>

            {/* Still have questions */}
            <div className="rounded-2xl border-2 border-neutral-900 bg-violet-500 p-6 text-center shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] md:p-8">
              <h3 className="mb-2 font-['Clash_Display'] text-2xl font-medium leading-7 text-white md:text-3xl">
                Still have questions?
              </h3>
              <p className="mb-6 font-['Satoshi'] text-base font-normal leading-7 text-white md:text-lg">
                Our support team is here to help with any refund-related questions.
              </p>
              <a
                href="mailto:admin@studojo.com"
                className="inline-flex h-12 items-center justify-center rounded-2xl border-2 border-neutral-900 bg-white px-6 font-['Satoshi'] text-base font-medium leading-6 text-violet-500 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
              >
                Contact Us
              </a>
            </div>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}

