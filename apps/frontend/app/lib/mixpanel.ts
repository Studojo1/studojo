import mixpanel from "mixpanel-browser";

const MIXPANEL_TOKEN = "78431f4d81860b16a66d35a343d0618e";

// Initialize Mixpanel
export function initMixpanel() {
  if (typeof window === "undefined") return;
  
  mixpanel.init(MIXPANEL_TOKEN, {
    debug: import.meta.env.DEV,
    track_pageview: true,
    persistence: "localStorage",
    autocapture: true,
    record_sessions_percent: 100,
  });
}

// Identify a user
export function identifyUser(userId: string, properties?: {
  email?: string;
  name?: string;
  [key: string]: any;
}) {
  if (typeof window === "undefined") return;
  
  mixpanel.identify(userId);
  
  if (properties) {
    mixpanel.people.set({
      $name: properties.name,
      $email: properties.email,
      ...properties,
    });
  }
}

// Track an event
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window === "undefined") return;
  
  mixpanel.track(eventName, properties);
}

// Reset Mixpanel (on logout)
export function resetMixpanel() {
  if (typeof window === "undefined") return;
  
  mixpanel.reset();
}

