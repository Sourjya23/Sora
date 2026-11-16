import posthog from "posthog-js";

/**
 * Production PostHog Telemetry & Session Replay Service
 * Configured for Sora interview assessment flows, tab switches, and live coding sessions.
 */
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || "phc_ByZ9ivop6X9J8vnNq4U8YVg6zuGduz8wQVXkuc2hpjJy";
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

let isInitialized = false;

export const initPostHog = () => {
  if (isInitialized) return posthog;

  try {
    if (typeof window !== "undefined") {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        autocapture: true,
        capture_pageview: true,
        capture_pageleave: true,
        disable_session_recording: false,
        session_recording: {
          maskAllInputs: false,
          maskInputOptions: {
            password: true,
          },
        },
        loaded: (ph) => {
          console.log("[PostHog] Initialized successfully with session replay active.");
        },
      });
      isInitialized = true;
    }
  } catch (err) {
    console.warn("[PostHog] Failed to initialize gracefully:", err.message);
  }

  return posthog;
};

/**
 * Identify authenticated user
 */
export const identifyUser = (user) => {
  if (!user || !user.email) return;
  try {
    posthog.identify(user._id || user.id || user.email, {
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (err) {
    console.warn("[PostHog] Identify error:", err.message);
  }
};

/**
 * Capture custom assessment & forensic telemetry
 */
export const captureAssessmentEvent = (eventName, properties = {}) => {
  try {
    posthog.capture(eventName, {
      timestamp: new Date().toISOString(),
      ...properties,
    });
  } catch (err) {
    console.warn("[PostHog] Event capture warning:", err.message);
  }
};

export default posthog;
