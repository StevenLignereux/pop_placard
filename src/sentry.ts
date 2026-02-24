import * as Sentry from "@sentry/react";

export const initSentry = () => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      // Performance Monitoring
      tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0, 
      // Session Replay
      replaysSessionSampleRate: 0.1, 
      replaysOnErrorSampleRate: 1.0, 
      environment: import.meta.env.MODE,
      beforeSend(event) {
        // Sanitize personal data if needed
        if (event.user) {
          delete event.user.ip_address;
        }
        return event;
      },
    });
  } else {
    console.warn("Sentry DSN not found, skipping initialization.");
  }
};
