import { NextRequest } from 'next/server';
import { verifyN8nInternalAuth } from '@repo/api-core';
import { fail } from '@/app/api/_shared/http/response';

export function unauthorizedN8nInternal() {
  return fail('Unauthorized request', 401);
}

export function assertN8nInternal(request: NextRequest): boolean {
  return verifyN8nInternalAuth(request.headers);
}
