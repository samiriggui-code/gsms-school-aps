import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import {
  buildLogCategoryWhere,
  resolveLogCategory,
  type LogCategory,
} from '@/lib/auth/auth-audit';

const CATEGORY_VALUES: LogCategory[] = [
  'connexion',
  'iam',
  'conformite',
  'documents',
];

function isLogCategory(value: string | null): value is LogCategory {
  return value !== null && CATEGORY_VALUES.includes(value as LogCategory);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const categoryParam = searchParams.get('category');

  try {
    const session = await getServerSession(authOptions);
    if (!session) return fail('Unauthorized request', 401);

    const where = isLogCategory(categoryParam)
      ? buildLogCategoryWhere(categoryParam)
      : undefined;

    const [totalCount, logs] = await Promise.all([
      prisma.systemLog.count({ where }),
      prisma.systemLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
    ]);

    const data = logs.map((log) => ({
      ...log,
      category: resolveLogCategory(log),
    }));

    return ok({
      logs: data,
      pagination: {
        total: totalCount,
        page,
        limit,
      },
    });
  } catch {
    return fail('Oops! Something went wrong. Please try again in a moment.', 500);
  }
}
