export function CareersFeatureCards() {
  return (
    <div className="flex w-full max-w-4xl flex-col gap-6 md:flex-row md:gap-6">
      {/* ATS Optimized */}
      <div className="flex flex-1 flex-col gap-6 rounded-2xl bg-white px-6 py-6 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] outline outline-2 outline-offset-[-2px] outline-black md:gap-10">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
          <svg
            className="h-6 w-6 text-emerald-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            <path d="M9 8h1v2H9V8z" />
          </svg>
        </div>
        <div>
          <h3 className="font-['Clash_Display'] text-2xl font-normal leading-6 text-neutral-950">
            ATS Optimized
          </h3>
          <p className="mt-2 font-['Satoshi'] text-sm font-normal leading-5 text-gray-600">
            Formatted to pass applicant tracking systems with ease.
          </p>
        </div>
      </div>

      {/* Professional Format */}
      <div className="flex flex-1 flex-col gap-6 rounded-2xl bg-white px-6 py-6 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] outline outline-2 outline-offset-[-2px] outline-black md:gap-10">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
          <svg
            className="h-6 w-6 text-emerald-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 6h16M4 10h16M4 14h10" />
          </svg>
        </div>
        <div>
          <h3 className="font-['Clash_Display'] text-2xl font-normal leading-6 text-neutral-950">
            Professional Format
          </h3>
          <p className="mt-2 font-['Satoshi'] text-sm font-normal leading-5 text-gray-600">
            Clean, modern design that impresses recruiters.
          </p>
        </div>
      </div>

      {/* Instant Results */}
      <div className="flex flex-1 flex-col gap-6 rounded-2xl bg-white px-6 py-6 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] outline outline-2 outline-offset-[-2px] outline-black md:gap-10">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
          <svg
            className="h-6 w-6 text-emerald-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h3 className="font-['Clash_Display'] text-2xl font-normal leading-6 text-neutral-950">
            Instant Results
          </h3>
          <p className="mt-2 font-['Satoshi'] text-sm font-normal leading-5 text-gray-600">
            Get your optimized resume in seconds, not hours.
          </p>
        </div>
      </div>
    </div>
  );
}
