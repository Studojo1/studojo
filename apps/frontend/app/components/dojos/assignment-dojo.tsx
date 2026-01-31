import { useState } from "react";
import { ChatInterface } from "./chat-interface";
import { FeatureCards } from "./feature-cards";
import { FloatingCardA, FloatingCardB } from "./floating-cards";

export function AssignmentDojoPage() {
  const [hasStartedChat, setHasStartedChat] = useState(false);

  return (
    <div className="w-full bg-white">
      {/* Hero – full width, below header, rounded corners, floating cards */}
      <section className="w-full">
        <div className="relative flex min-h-[420px] w-full flex-col items-center justify-center gap-6 rounded-b-2xl bg-violet-500 px-4 py-16 md:min-h-[400px] md:gap-8 md:py-20">
          {/* Floating cards – left & right, animate across, opacity 0.2 */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-between overflow-visible px-4 md:px-12 lg:px-16">
            <div className="hidden opacity-20 md:block">
              <FloatingCardA />
            </div>
            <div className="hidden opacity-20 md:block">
              <FloatingCardB />
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-6 text-center md:gap-8">
            {/* Badge */}
            <div className="rounded-full bg-white/20 px-5 py-2 shadow-sm">
              <span className="font-['Satoshi'] text-sm font-normal leading-5 text-white">
                AI-Powered Assignment Generator
              </span>
            </div>

            {/* Heading */}
            <h1 className="max-w-xl font-['Clash_Display'] text-3xl font-semibold leading-tight tracking-tight text-white md:text-4xl lg:text-5xl">
              Create Perfect Assignments in Seconds
            </h1>

            {/* Description */}
            <p className="max-w-2xl font-['Satoshi'] text-sm font-normal leading-6 text-white/90 md:text-base md:leading-7">
              Generate comprehensive, well-structured assignments for any subject
              and academic level. Perfect for educators creating engaging
              coursework.
            </p>
          </div>
        </div>
      </section>

      {/* Chatbox – below hero */}
      <section className="w-full bg-white">
        <div className="mx-auto max-w-[var(--section-max-width)] px-4 py-6 md:px-8 md:py-8">
          <div className="flex justify-center">
            <ChatInterface onFirstMessage={() => setHasStartedChat(true)} />
          </div>
        </div>
      </section>

      {/* Feature cards - only show before first message */}
      {!hasStartedChat && (
        <section className="w-full border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-[var(--section-max-width)] px-4 py-12 md:px-8 md:py-16">
            <div className="flex justify-center">
              <FeatureCards />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
