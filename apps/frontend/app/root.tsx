import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "react-router";
import { Toaster } from "sonner";
import { useEffect } from "react";

import type { Route } from "./+types/root";
import { authClient } from "./lib/auth-client";
import { identifyUser, initMixpanel, trackEvent } from "./lib/mixpanel";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.png", type: "image/png" },
  { rel: "preconnect", href: "https://api.fontshare.com" },
  {
    rel: "stylesheet",
    href: "https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&f[]=satoshi@400,500,700,900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            classNames: {
              toast: "font-['Satoshi']",
              title: "font-['Satoshi'] font-medium",
              description: "font-['Satoshi']",
              success: "bg-emerald-50 border-emerald-200 text-emerald-900",
              error: "bg-red-50 border-red-200 text-red-900",
              info: "bg-blue-50 border-blue-200 text-blue-900",
            },
          }}
        />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function MixpanelInit() {
  const { data: session } = authClient.useSession();
  const location = useLocation();

  useEffect(() => {
    initMixpanel();
  }, []);

  // Identify user when session is available
  useEffect(() => {
    if (session?.user) {
      identifyUser(session.user.id, {
        email: session.user.email,
        name: session.user.name,
      });
    }
  }, [session]);

  // Track page views
  useEffect(() => {
    if (typeof window !== "undefined") {
      trackEvent("Page View", {
        page_url: window.location.href,
        page_title: document.title,
        user_id: session?.user?.id,
      });
    }
  }, [location.pathname, session?.user?.id]);

  return null;
}

export default function App() {
  return (
    <>
      <MixpanelInit />
      <Outlet />
    </>
  );
}

function ErrorTracker({ errorType, errorMessage, errorCode }: { errorType: string; errorMessage: string; errorCode?: string }) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const session = authClient.getSession();
      trackEvent("Error", {
        error_type: errorType,
        error_message: errorMessage,
        error_code: errorCode,
        page_url: window.location.href,
        user_id: session?.user?.id,
      });
    }
  }, [errorType, errorMessage, errorCode]);
  return null;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;
  let errorType = "unknown";
  let errorCode: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
    errorType = "server";
    errorCode = error.status.toString();
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
    errorType = "application";
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <ErrorTracker errorType={errorType} errorMessage={details} errorCode={errorCode} />
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
