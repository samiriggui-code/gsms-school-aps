import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import {
  runModuleSync,
  scopesForPreset,
  type DatagridSyncPreset,
} from '@repo/api-core';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

const PRESETS = new Set<string>([
  'rhAbsences',
  'rhPersonnel',
  'rhTeams',
  'rhConformite',
  'equipements',
  'compagnieDocuments',
  'vieScolaire',
  'candidats',
  'finance',
]);

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.securiteEdit)) {
    return fail('Forbidden', 403);
  }

  let body: { preset?: string };
  try {
    body = await request.json();
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const presetRaw = String(body.preset ?? '').trim();
  if (!PRESETS.has(presetRaw)) {
    return fail('Preset de synchronisation inconnu.', 400);
  }

  const preset = presetRaw as DatagridSyncPreset;

  try {
    const result = await runModuleSync(prisma, preset);
    return ok({
      preset: result.preset,
      scopes: result.scopes,
      summary: Object.fromEntries(
        Object.entries(result.results).map(([key, value]) => {
          if (key === 'rh-absences' && value && typeof value === 'object') {
            const v = value as { scanned?: number; changed?: number };
            return [key, { scanned: v.scanned ?? 0, changed: v.changed ?? 0 }];
          }
          if (key === 'crm-events' && value && typeof value === 'object') {
            const v = value as { processed?: number; total?: number };
            return [key, { processed: v.processed ?? 0, total: v.total ?? 0 }];
          }
          return [key, 'ok'];
        }),
      ),
    });
  } catch (error) {
    console.error('[COMMON_SYNC]', error);
    return fail('Synchronisation impossible.', 500, error);
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  return ok({
    presets: Array.from(PRESETS),
    scopesByPreset: Object.fromEntries(
      Array.from(PRESETS).map((preset) => [
        preset,
        scopesForPreset(preset as DatagridSyncPreset),
      ]),
    ),
  });
}
