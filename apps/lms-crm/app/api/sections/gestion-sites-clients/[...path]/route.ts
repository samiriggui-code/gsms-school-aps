import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { ok, fail } from '@/app/api/_shared/http/response';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

type Params = { params: Promise<{ path: string[] }> };

async function handler(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  const method = request.method.toUpperCase();
  const needed =
    method === 'GET' ? CRM_PERMISSION.ressourcesView : CRM_PERMISSION.ressourcesEdit;
  if (!sessionHasPermission(session, needed)) {
    return fail('Forbidden', 403);
  }

  const parts = (await params).path || [];
  const joined = parts.join('/');

  if (joined === 'clients/sites') {
    return ok([]);
  }

  return fail('Section endpoint not mapped yet', 501, { endpoint: joined });
}

export async function GET(request: NextRequest, ctx: Params) {
  return handler(request, ctx);
}

export async function POST(request: NextRequest, ctx: Params) {
  return handler(request, ctx);
}

export async function PATCH(request: NextRequest, ctx: Params) {
  return handler(request, ctx);
}

export async function PUT(request: NextRequest, ctx: Params) {
  return handler(request, ctx);
}

export async function DELETE(request: NextRequest, ctx: Params) {
  return handler(request, ctx);
}
