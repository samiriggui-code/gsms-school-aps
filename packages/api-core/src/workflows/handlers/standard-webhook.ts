import { createHmac } from 'node:crypto';
import { STANDARD_WEBHOOK_EVENT_META, type StandardWebhookEventType } from '../standard-catalog';

export const STANDARD_WEBHOOK_GROUP = 'standard';

const STANDARD_TIMEOUT_MS = 8_000;

function isStandardEnabled(): boolean {
  const raw =
    process.env.WORKFLOWS_N8N_STANDARD_ENABLED ?? process.env.N8N_WEBHOOK_STANDARD_ENABLED;
  if (raw === '0' || raw === 'false' || raw === 'FALSE') return false;
  if (raw === '1' || raw === 'true' || raw === 'TRUE') return true;
  return Boolean(resolveStandardWebhookUrl());
}

export function resolveStandardWebhookUrl(): string | null {
  const direct = process.env.N8N_WEBHOOK_STANDARD_URL?.trim();
  if (direct) return direct;

  const base = process.env.N8N_WEBHOOK_BASE?.trim();
  if (base) return `${base.replace(/\/$/, '')}/webhook/gsms/standard`;

  return null;
}

function signBody(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

export async function dispatchStandardWebhook(
  eventType: StandardWebhookEventType,
  payload: Record<string, unknown>,
): Promise<void> {
  if (!isStandardEnabled()) return;

  const url = resolveStandardWebhookUrl();
  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[workflow] Webhook standard ignoré : N8N_WEBHOOK_STANDARD_URL ou N8N_WEBHOOK_BASE absent',
      );
    }
    return;
  }

  const meta = STANDARD_WEBHOOK_EVENT_META[eventType];

  const envelope = {
    group: STANDARD_WEBHOOK_GROUP,
    event: eventType,
    emittedAt: new Date().toISOString(),
    source: 'gsms-lms',
    app: meta.app,
    domain: meta.domain,
    action: meta.action,
    payload,
  };

  const body = JSON.stringify(envelope);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'gsms-workflow-engine/standard-1',
    'X-GSMS-Webhook-Group': STANDARD_WEBHOOK_GROUP,
  };

  const secret =
    process.env.N8N_WEBHOOK_STANDARD_SECRET?.trim() ||
    process.env.N8N_WEBHOOK_SECRET?.trim();
  if (secret) {
    headers['X-GSMS-Signature'] = signBody(body, secret);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), STANDARD_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(
        `[workflow] webhook standard HTTP ${res.status}`,
        text.slice(0, 300),
      );
    }
  } catch (err) {
    console.error(
      '[workflow] webhook standard échec',
      err instanceof Error ? err.message : err,
    );
  } finally {
    clearTimeout(timer);
  }
}
