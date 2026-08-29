const sentryDsn =
  process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || '';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { bootstrapDocTypes } = await import('@/lib/doctype/bootstrap');
      bootstrapDocTypes();
    } catch (err) {
      console.error('[doctype] instrumentation bootstrap error (non-fatal)', err);
    }
  }

  if (!sentryDsn.trim()) return;
  if (process.env.NODE_ENV !== 'production' && process.env.SENTRY_DEV !== 'true') {
    return;
  }

  const Sentry = await import('@sentry/nextjs');
  Sentry.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
  });
}

export async function onRequestError(...args: Parameters<typeof import('@sentry/nextjs').captureRequestError>) {
  if (!sentryDsn.trim()) return;
  if (process.env.NODE_ENV !== 'production' && process.env.SENTRY_DEV !== 'true') {
    return;
  }
  const Sentry = await import('@sentry/nextjs');
  return Sentry.captureRequestError(...args);
}
