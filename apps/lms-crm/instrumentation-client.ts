const sentryDsn =
  process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || '';
const sentryEnabled =
  Boolean(sentryDsn.trim()) &&
  (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_SENTRY_DEV === 'true');

if (sentryEnabled) {
  void import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
      replaysOnErrorSampleRate: 1.0,
      replaysSessionSampleRate: 0.0,
    });
  });
}

export async function onRouterTransitionStart(
  ...args: Parameters<typeof import('@sentry/nextjs').captureRouterTransitionStart>
) {
  if (!sentryEnabled) return;
  const Sentry = await import('@sentry/nextjs');
  return Sentry.captureRouterTransitionStart(...args);
}
