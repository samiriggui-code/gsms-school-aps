import { resolveEmailAssetsOrigin, FORMSSI_EMAIL_BRAND } from '@repo/emails';
import nodemailer from 'nodemailer';

export type SmtpTransportConfig = {
  host: string;
  port: number;
  secure: boolean;
  auth?: { user: string; pass: string };
  from: string;
  fromAddress: string;
  senderName: string;
};

export class SendEmailError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'SendEmailError';
  }
}

const isProduction = process.env.NODE_ENV === 'production';

function isLocalSmtpHost(host: string) {
  const h = host.toLowerCase();
  return h === '127.0.0.1' || h === 'localhost' || h === '::1';
}

/** Valeurs d’exemple `.env` — en dev on bascule sur Mailpit local. */
function isPlaceholderFromAddress(address: string): boolean {
  const a = address.trim().toLowerCase();
  if (!a || !a.includes('@')) return true;
  return (
    a.includes('domain.com') ||
    a.includes('example.com') ||
    a.includes('your_') ||
    a.includes('changeme') ||
    a.includes('replace_me')
  );
}

function resolveSenderName(): string {
  const raw = process.env.SMTP_SENDER?.trim();
  if (!raw) return FORMSSI_EMAIL_BRAND.productName;
  const lower = raw.toLowerCase();
  if (
    lower === 'metronic' ||
    lower.includes('your_') ||
    lower.includes('example') ||
    lower.includes('changeme')
  ) {
    return FORMSSI_EMAIL_BRAND.productName;
  }
  return raw;
}

function resolveFromAddress(user?: string): string {
  let fromAddress = process.env.SMTP_FROM?.trim() || user || 'noreply@localhost';
  if (!fromAddress.includes('@') && user?.includes('@')) {
    fromAddress = user;
  }
  if (isPlaceholderFromAddress(fromAddress)) {
    fromAddress = user?.includes('@') ? user : 'noreply@localhost';
  }
  return fromAddress;
}

function formatEmailFrom(name: string, address: string): string {
  return `${name} <${address}>`;
}

/** Valeurs d’exemple `.env` — en dev on bascule sur Mailpit local. */
function isPlaceholderSmtpHost(host: string): boolean {
  const h = host.trim().toLowerCase();
  if (!h) return true;
  return (
    h === 'your_smtp_host' ||
    h === 'smtp.example.com' ||
    h.includes('your_smtp') ||
    h.includes('changeme') ||
    h.includes('replace_me') ||
    h.startsWith('xxx')
  );
}

function resolveSmtpHost(): string {
  const raw = process.env.SMTP_HOST?.trim() ?? '';
  if (!raw || isPlaceholderSmtpHost(raw)) {
    if (isProduction) return '';
    return '127.0.0.1';
  }
  return raw;
}

export function isResendConfigured(): boolean {
  const key = process.env.RESEND_API_KEY?.trim() ?? '';
  if (!key) return false;
  return !key.toLowerCase().includes('your_') && !key.startsWith('re_xxx');
}

export function isSmtpConfigured(): boolean {
  const host = process.env.SMTP_HOST?.trim() ?? '';
  if (!host || isPlaceholderSmtpHost(host)) {
    return !isProduction;
  }
  return true;
}

export function isEmailConfigured(): boolean {
  if (isResendConfigured()) return true;
  if (isSmtpConfigured()) return true;
  if (!isProduction) return true;
  return false;
}

export function getContactRecipient(): string {
  const smtpUser = process.env.SMTP_USER?.trim();
  return (
    process.env.CONTACT_TO_EMAIL?.trim() ||
    process.env.CONTACT_TO?.trim() ||
    process.env.SUPPORT_EMAIL?.trim() ||
    smtpUser ||
    'contact-formssi@gmail.com'
  );
}

export function getSupportEmail(): string {
  return process.env.SUPPORT_EMAIL?.trim() || getContactRecipient();
}

export function getSmtpTransportConfig(): SmtpTransportConfig | null {
  let host = resolveSmtpHost();
  if (!host) return null;

  const portEnv = process.env.SMTP_PORT?.trim();
  let port: number;
  const portNum = portEnv ? Number(portEnv) : NaN;
  if (Number.isFinite(portNum) && portNum > 0) {
    port = portNum;
  } else if (!isProduction && isLocalSmtpHost(host)) {
    port = 1025;
  } else {
    port = 465;
  }

  let secure: boolean;
  if (process.env.SMTP_SECURE === 'true') secure = true;
  else if (process.env.SMTP_SECURE === 'false') secure = false;
  else secure = port === 465;

  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  const fromAddress = resolveFromAddress(user);
  const senderName = resolveSenderName();

  return {
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    from: formatEmailFrom(senderName, fromAddress),
    fromAddress,
    senderName,
  };
}

export interface SendEmailProps {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

async function sendViaResend(input: SendEmailProps): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new SendEmailError('RESEND_API_KEY manquant.');
  }

  const user = process.env.SMTP_USER?.trim();
  const senderName = resolveSenderName();
  const fromAddress = resolveFromAddress(user);
  const resendRaw = process.env.RESEND_FROM?.trim();
  let from =
    resendRaw && !/metronic/i.test(resendRaw) && !resendRaw.includes('domain.com')
      ? resendRaw
      : formatEmailFrom(senderName, fromAddress);
  if (!from.includes('@')) {
    throw new SendEmailError('RESEND_FROM ou SMTP_FROM requis avec Resend.');
  }

  const body: Record<string, unknown> = {
    from,
    to: [input.to],
    subject: input.subject,
    html: input.html,
    text: input.text,
  };
  if (input.replyTo) {
    body.reply_to = input.replyTo;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText);
    throw new SendEmailError(`Resend ${res.status}: ${detail}`);
  }
}

export async function sendEmail(input: SendEmailProps): Promise<void> {
  if (!isEmailConfigured()) {
    throw new SendEmailError(
      'Aucun canal e-mail (RESEND_API_KEY ou SMTP_HOST). Voir .env.',
    );
  }

  try {
    if (isResendConfigured()) {
      await sendViaResend(input);
      console.info(`[resend] sent → ${input.to}`);
      return;
    }

    const smtp = getSmtpTransportConfig();
    if (!smtp) {
      throw new SendEmailError('Configuration SMTP invalide.');
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: smtp.auth,
      tls: smtp.secure ? undefined : { rejectUnauthorized: false },
    });

    await transporter.sendMail({
      from: { name: smtp.senderName, address: smtp.fromAddress },
      sender: smtp.fromAddress,
      envelope: { from: smtp.fromAddress, to: input.to },
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
    });
    console.info(`[smtp] sent → ${input.to}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[email] failed → ${input.to}: ${message}`);
    if (error instanceof SendEmailError) throw error;
    throw new SendEmailError(message, error);
  }
}

export function ensureEmailAssetsOrigin(fallbackOrigin?: string): void {
  process.env.EMAIL_ASSETS_ORIGIN = resolveEmailAssetsOrigin(fallbackOrigin);
}
