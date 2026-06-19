import NextAuth from 'next-auth';
import type { NextRequest } from 'next/server';
import { getAuthOptions } from './auth-options';

async function auth(
  req: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> },
) {
  return NextAuth(req, context, getAuthOptions(req));
}

export { auth as GET, auth as POST };
