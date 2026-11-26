// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const dsn = (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)?.trim();

if (dsn) {
  Sentry.init({
    dsn,

    tracesSampleRate: 0.15,
    enableLogs: true,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
        delete event.request.headers['x-bitgard-signature'];
        delete event.request.headers['x-diagnostic-secret'];
        delete event.request.headers['x-forwarded-for'];
        delete event.request.headers['x-real-ip'];
        delete event.request.headers['x-vercel-forwarded-for'];
        delete event.request.headers['cf-connecting-ip'];
        delete event.request.headers['true-client-ip'];
        delete event.request.headers['forwarded'];
      }
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      return event;
    },
  });
}
