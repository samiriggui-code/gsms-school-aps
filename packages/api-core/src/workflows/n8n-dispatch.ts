import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  STANDARD_WEBHOOK_CRM,
  type StandardWebhookEventType,
} from './standard-catalog';

export type N8nDispatchChannel = 'email' | 'notification' | 'chat';

export type N8nDispatchInput = {
  channels: N8nDispatchChannel[];
  event: string;
  payload: Record<string, unknown>;
  emittedAt?: string;
  /** Destinataire email (candidat/client) — sinon email ops. */
  emailTo?: string;
  emailSubject?: string;
  emailBody?: string;
};

export type N8nDispatchMessage = {
  event: StandardWebhookEventType;
  title: string;
  body: string;
  href: string | null;
  crmEventType: string;
  moduleKey: string;
  category: string;
  severity: string;
  dedupeKey: string;
};

function resolveSecret(): string | null {
  return (
    process.env.N8N_WEBHOOK_STANDARD_SECRET?.trim() ||
    process.env.N8N_WEBHOOK_SECRET?.trim() ||
    null
  );
}

function signBody(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, 'hex');
    const bb = Buffer.from(b, 'hex');
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/** Vérifie l’appel retour n8n → CRM (secret header ou signature HMAC). */
export function verifyN8nCallbackAuth(
  headers: Headers,
  rawBody: string,
): boolean {
  const secret = resolveSecret();
  if (!secret) return false;

  const internal = headers.get('x-gsms-internal-secret')?.trim();
  if (internal && internal === secret) return true;

  const signature = headers.get('x-gsms-signature')?.trim();
  if (signature) {
    const expected = signBody(rawBody, secret);
    return safeEqualHex(signature, expected);
  }

  return false;
}

function entityId(payload: Record<string, unknown>): string {
  for (const key of [
    'candidatureId',
    'devisId',
    'leadId',
    'paymentId',
    'sessionId',
    'contactId',
    'preinscriptionId',
    'referenceCode',
  ]) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return 'generic';
}

export function parseN8nDispatchInput(raw: unknown): N8nDispatchInput | null {
  if (!raw || typeof raw !== 'object') return null;
  const body = raw as Record<string, unknown>;
  const event = typeof body.event === 'string' ? body.event.trim() : '';
  if (!event) return null;

  const channelsRaw = body.channels;
  const allowed: N8nDispatchChannel[] = ['email', 'notification', 'chat'];
  const channels = Array.isArray(channelsRaw)
    ? channelsRaw.filter(
        (c): c is N8nDispatchChannel =>
          typeof c === 'string' && allowed.includes(c as N8nDispatchChannel),
      )
    : [];

  if (channels.length === 0) return null;

  const payload =
    body.payload && typeof body.payload === 'object' && !Array.isArray(body.payload)
      ? (body.payload as Record<string, unknown>)
      : {};

  const emittedAt = typeof body.emittedAt === 'string' ? body.emittedAt : undefined;

  const emailTo = typeof body.emailTo === 'string' ? body.emailTo.trim() : undefined;
  const emailSubject = typeof body.emailSubject === 'string' ? body.emailSubject.trim() : undefined;
  const emailBody = typeof body.emailBody === 'string' ? body.emailBody.trim() : undefined;

  return { channels, event, payload, emittedAt, emailTo, emailSubject, emailBody };
}

export function buildN8nDispatchMessage(
  event: string,
  payload: Record<string, unknown>,
  emittedAt?: string,
): N8nDispatchMessage | null {
  const definition = STANDARD_WEBHOOK_CRM[event as StandardWebhookEventType];
  if (!definition) return null;

  const id = entityId(payload);
  const stamp = emittedAt ?? new Date().toISOString();

  return {
    event: event as StandardWebhookEventType,
    title: definition.buildTitle(payload),
    body: definition.buildBody(payload),
    href: definition.buildHref?.(payload) ?? null,
    crmEventType: definition.crmEventType,
    moduleKey: definition.moduleKey,
    category: definition.category,
    severity: definition.severity,
    dedupeKey: `n8n:${event}:${id}:${stamp.slice(0, 13)}`,
  };
}
