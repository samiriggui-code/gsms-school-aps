import { NextRequest } from 'next/server';
import { CRM_PERMISSION } from '@/lib/auth/crm-permissions';
import { requireCrmApiAuth } from '@/lib/auth/require-permission';
import { internalApiOrigin } from '@/lib/internal-api-origin';

export async function GET(request: NextRequest) {
  const auth = await requireCrmApiAuth(CRM_PERMISSION.dashboard);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const target = `${internalApiOrigin()}/api/dashboard/stats${url.search}`;
  const cookie = request.headers.get('cookie');
  const response = await fetch(target, {
    method: 'GET',
    cache: 'no-store',
    headers: cookie ? { cookie } : undefined,
  });
  const text = await response.text();

  return new Response(text, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') || 'application/json',
    },
  });
}
