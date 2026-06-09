import { createHmac } from 'node:crypto';

const N8N_TIMEOUT_MS = 8_000;

function isN8nEnabled(): boolean {
  const raw = process.env.WORKFLOWS_N8N_ENABLED ?? process.env.N8N_WEBHOOK_ENABLED;
  if (raw === '0' || raw === 'false' || raw === 'FALSE') return false;
  if (raw === '1' || raw === 'true' || raw === 'TRUE') return true;
  return process.env.NODE_ENV === 'production';
}

function resolveWebhookUrl(): string | null {
  const direct = process.env.N8N_WEBHOOK_URL?.trim();
  if (direct) return direct;

  const base = process.env.N8N_WEBHOOK_BASE?.trim();
  if (base) return base.replace(/\/$/, '');

  return null;
}

function signBody(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

export async function dispatchN8nWebhook(
  eventType: string,
  payload: Record<string, unknown>,
): Promise<void> {
  if (!isN8nEnabled()) return;

  const url = resolveWebhookUrl();
  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[workflow] N8N webhook ignoré : N8N_WEBHOOK_URL ou N8N_WEBHOOK_BASE absent');
    }
    return;
  }

  const envelope = {
    event: eventType,
    emittedAt: new Date().toISOString(),
    source: 'gsms-lms',
    payload,
  };

  const body = JSON.stringify(envelope);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'gsms-workflow-engine/0.1',
  };

  const secret = process.env.N8N_WEBHOOK_SECRET?.trim();
  if (secret) {
    headers['X-GSMS-Signature'] = signBody(body, secret);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS);

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
        `[workflow] n8n webhook HTTP ${res.status}`,
        text.slice(0, 300),
      );
    }
  } catch (err) {
    console.error('[workflow] n8n webhook échec', err instanceof Error ? err.message : err);
  } finally {
    clearTimeout(timer);
  }
}
