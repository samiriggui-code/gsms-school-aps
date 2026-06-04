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

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST?.trim());
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
  let host = process.env.SMTP_HOST?.trim() ?? '';
  if (!host) {
    if (isProduction) return null;
    host = '127.0.0.1';
  }

  const portEnv = process.env.SMTP_PORT?.trim();
  let port: number;
  if (portEnv) {
    port = Number(portEnv) || 465;
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

  let fromAddress = process.env.SMTP_FROM?.trim() || user || 'noreply@localhost';
  if (!fromAddress.includes('@') && user?.includes('@')) {
    fromAddress = user;
  }

  const senderName = (process.env.SMTP_SENDER ?? "FORM'SSI").trim();

  return {
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    from: `${senderName} <${fromAddress}>`,
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

  const from = process.env.RESEND_FROM?.trim() || process.env.SMTP_FROM?.trim();
  if (!from) {
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
  const assetsOrigin =
    process.env.EMAIL_ASSETS_ORIGIN?.trim() ||
    fallbackOrigin?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    'http://127.0.0.1:3000';
  process.env.EMAIL_ASSETS_ORIGIN = assetsOrigin.replace(/\/$/, '');
}
