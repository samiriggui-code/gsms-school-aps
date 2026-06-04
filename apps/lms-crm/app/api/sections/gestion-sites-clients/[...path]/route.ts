import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';

type Params = { params: Promise<{ path: string[] }> };

async function handler(_: NextRequest, { params }: Params) {
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
