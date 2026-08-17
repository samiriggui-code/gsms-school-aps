import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { requireCrmApiAuth } from '@/lib/auth/require-permission';
import { CRM_PERMISSION } from '@/lib/auth/crm-permissions';
import { isAllowedModuleSetting } from '@repo/api-core';

/** Registre paramètres par module (clé/valeur JSON). */
export async function GET(request: NextRequest) {
  const auth = await requireCrmApiAuth(CRM_PERMISSION.securiteView);
  if (!auth.ok) return auth.response;

  const moduleKey = (request.nextUrl.searchParams.get('moduleKey') ?? '').trim();
  const rows = await prisma.moduleSetting.findMany({
    where: moduleKey ? { moduleKey } : {},
    orderBy: [{ moduleKey: 'asc' }, { settingKey: 'asc' }],
  });

  return ok(rows);
}

export async function POST(request: NextRequest) {
  const auth = await requireCrmApiAuth(CRM_PERMISSION.securiteEdit);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const moduleKey = String(body.moduleKey ?? '').trim();
  const settingKey = String(body.settingKey ?? '').trim();
  const value = body.value ?? {};

  if (!moduleKey || !settingKey) {
    return fail('moduleKey et settingKey requis.', 400);
  }

  if (!isAllowedModuleSetting(moduleKey, settingKey)) {
    return fail(`Combinaison moduleKey/settingKey non autorisée : ${moduleKey}/${settingKey}.`, 400);
  }

  const row = await prisma.moduleSetting.upsert({
    where: { moduleKey_settingKey: { moduleKey, settingKey } },
    create: {
      moduleKey,
      settingKey,
      value: value as object,
      updatedById: auth.userId,
    },
    update: {
      value: value as object,
      updatedById: auth.userId,
    },
  });

  return ok(row);
}
