import { createHmac, timingSafeEqual } from 'node:crypto';

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

/** Auth n8n → CRM pour GET/POST internes (header secret ou HMAC body). */
export function verifyN8nInternalAuth(headers: Headers, rawBody = ''): boolean {
  const secret = resolveSecret();
  if (!secret) return false;

  const internal = headers.get('x-gsms-internal-secret')?.trim();
  if (internal && internal === secret) return true;

  if (rawBody) {
    const signature = headers.get('x-gsms-signature')?.trim();
    if (signature) {
      const expected = signBody(rawBody, secret);
      return safeEqualHex(signature, expected);
    }
  }

  return false;
}

export type SessionCircuitMilestone = {
  key: string;
  offsetDays: number;
  label: string;
  action: string;
};

/** Jalons par défaut — équivalent circuit VisioFORMATION (TFP APS). */
export const DEFAULT_SESSION_CIRCUIT: SessionCircuitMilestone[] = [
  { key: 'jMinus15', offsetDays: -15, label: 'Convention entreprise', action: 'notify' },
  { key: 'jMinus10', offsetDays: -10, label: 'Convocation + docs formateur', action: 'notify' },
  { key: 'jMinus5', offsetDays: -5, label: 'Auto-évaluation + email candidat', action: 'notify' },
  { key: 'j0', offsetDays: 0, label: 'Rappel émargement J0', action: 'notify' },
  { key: 'jFin', offsetDays: 0, label: 'Satisfaction à chaud', action: 'notify' },
  { key: 'jPlus45', offsetDays: 45, label: 'Satisfaction à froid', action: 'notify' },
];

function addDays(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function computeSessionMilestones(
  startDate: Date,
  endDate: Date,
  circuit: SessionCircuitMilestone[] = DEFAULT_SESSION_CIRCUIT,
): Array<SessionCircuitMilestone & { at: string }> {
  return circuit.map((m) => {
    const anchor = m.key === 'jFin' || m.key === 'jPlus45' ? endDate : startDate;
    const at = m.key === 'jFin' ? endDate : addDays(anchor, m.offsetDays);
    return { ...m, at: at.toISOString() };
  });
}
