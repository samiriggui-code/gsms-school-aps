import { EMAIL_TEMPLATE_CATALOG, CRM_EVENT_EMAIL_TEMPLATE } from '@repo/emails';
import { ok, fail } from '@/app/api/_shared/http/response';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

/** Catalogue des templates React Email et mapping événements CRM → e-mail. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized', 401);

  return ok({
    templates: EMAIL_TEMPLATE_CATALOG,
    eventMap: CRM_EVENT_EMAIL_TEMPLATE,
    emailFlags: {
      resourceOpsDisabled: process.env.RESOURCE_OPS_EMAIL_DISABLED === '1',
      reportEmailDisabled: process.env.REPORT_EMAIL_DISABLED === '1',
    },
  });
}
