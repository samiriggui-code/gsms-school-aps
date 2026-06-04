import {
  sendEmail as sendMailCore,
  type SendEmailProps as CoreSendEmailProps,
} from '@repo/mail';

export interface SendEmailContent {
  title?: string;
  subtitle?: string;
  description?: string;
  buttonLabel?: string;
  buttonUrl?: string;
}

export interface SendEmailProps extends CoreSendEmailProps {
  content?: SendEmailContent;
}

function buildLegacyHtml(subject: string, content: SendEmailContent): string {
  const { title, subtitle, description, buttonLabel, buttonUrl } = content;

  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <title>${subject}</title>
  </head>
  <body style="margin: 0; padding: 20px 10px; background-color: #f3f4f6; font-family: Inter, Arial, sans-serif; color: #0f172a;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="5" style="background-color: #ffffff; border-radius: 8px;">
            <tr>
              <td align="center" style="padding: 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 20px;">FORM'SSI</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px; color: #334155;">
                ${title ? `<h2 style="margin-top: 0; font-size: 20px;">${title}</h2>` : ''}
                ${subtitle ? `<p style="margin: 10px 0; font-size: 16px;">${subtitle}</p>` : ''}
                ${
                  buttonLabel && buttonUrl
                    ? `<p style="text-align: center; margin: 30px 0;">
                        <a href="${buttonUrl}" style="display: inline-block; background-color: #0284c7; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
                          ${buttonLabel}
                        </a>
                      </p>`
                    : ''
                }
                ${description ? `<p style="margin: 20px 0; font-size: 16px;">${description}</p>` : ''}
                <p style="margin: 10px 0; font-size: 16px;">
                  Cordialement,<br />
                  L'équipe FORM'SSI
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendEmail({ to, subject, text, html, content }: SendEmailProps) {
  const resolvedHtml =
    html ?? (content ? buildLegacyHtml(subject, content) : undefined);

  await sendMailCore({
    to,
    subject,
    text,
    html: resolvedHtml,
  });
}

export {
  renderDevisQuoteEmailHtml,
  ensureEmailAssetsOrigin,
  isEmailConfigured,
} from '@repo/mail';

export type { DevisQuoteEmailProps } from '@repo/emails';
