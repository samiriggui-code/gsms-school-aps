import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Prisma } from '@repo/database';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { loadSystemSettings } from '@/app/api/_shared/company-profile-get';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import {
  ADMIN_DOCUMENT_SLOTS,
  ADMIN_DOCUMENT_SLOT_IDS,
  type AdministrativeDossierHistoryEntry,
  type AdministrativeDossierJson,
} from '@/lib/admin-document-slots';

const HISTORY_CAP = 80;

const userPublicSelect = {
  id: true,
  name: true,
  email: true,
  firstName: true,
  lastName: true,
  avatar: true,
  status: true,
} satisfies Prisma.UserSelect;

type PublicUser = Prisma.UserGetPayload<{ select: typeof userPublicSelect }>;

function parseDossier(raw: unknown): AdministrativeDossierJson {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return raw as AdministrativeDossierJson;
}

function daysUntil(dateIso: string | null | undefined): number | null {
  if (!dateIso || typeof dateIso !== 'string') return null;
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return null;
  const t0 = new Date();
  t0.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - t0.getTime()) / (86400 * 1000));
}

function normStr(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function appendHistory(
  prev: AdministrativeDossierJson[string] | undefined,
  entry: AdministrativeDossierHistoryEntry,
): AdministrativeDossierHistoryEntry[] {
  const raw = prev?.history;
  const base = Array.isArray(raw) ? raw.filter((e) => e && typeof e.userId === 'string' && typeof e.at === 'string') : [];
  const next = [...base, entry];
  if (next.length > HISTORY_CAP) next.splice(0, next.length - HISTORY_CAP);
  return next;
}

async function loadUsersByIds(ids: Iterable<string>): Promise<Map<string, PublicUser>> {
  const uniq = Array.from(new Set(Array.from(ids).filter(Boolean)));
  if (!uniq.length) return new Map();
  const users = await prisma.user.findMany({
    where: { id: { in: uniq } },
    select: userPublicSelect,
  });
  return new Map(users.map((u) => [u.id, u]));
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const settings = await loadSystemSettings();
  if (!settings) return fail('Configuration établissement introuvable.', 404);

  const dossier = parseDossier(settings.administrativeDossier);
  const ids = Object.values(dossier)
    .map((e) => e?.fileAssetId)
    .filter((id): id is string => Boolean(id));

  const files = ids.length
    ? await prisma.fileAsset.findMany({
        where: { id: { in: ids }, status: 'ACTIVE', deletedAt: null },
        select: {
          id: true,
          url: true,
          originalName: true,
          mimeType: true,
          createdAt: true,
          createdById: true,
          createdBy: { select: userPublicSelect },
        },
      })
    : [];
  const byId = new Map(files.map((f) => [f.id, f]));

  const userIdSet = new Set<string>();
  for (const def of ADMIN_DOCUMENT_SLOTS) {
    const row = dossier[def.id] || {};
    if (row.updatedByUserId) userIdSet.add(row.updatedByUserId);
    const h = row.history;
    if (Array.isArray(h)) {
      for (const e of h) {
        if (e?.userId) userIdSet.add(e.userId);
      }
    }
    const fid = row.fileAssetId;
    if (fid) {
      const f = byId.get(fid);
      if (f?.createdById) userIdSet.add(f.createdById);
    }
  }
  const userMap = await loadUsersByIds(userIdSet);

  const slots = ADMIN_DOCUMENT_SLOTS.map((def) => {
    const row = dossier[def.id] || {};
    const fid = row.fileAssetId || null;
    const fileRow = fid ? (byId.get(fid) ?? null) : null;
    const file = fileRow
      ? {
          id: fileRow.id,
          url: fileRow.url,
          originalName: fileRow.originalName,
          mimeType: fileRow.mimeType,
          createdAt: fileRow.createdAt.toISOString(),
          createdBy: fileRow.createdBy ?? null,
        }
      : null;

    const historyRaw = Array.isArray(row.history) ? row.history : [];
    const history = historyRaw
      .filter((e): e is AdministrativeDossierHistoryEntry => Boolean(e?.at && e?.userId && e?.action))
      .map((e) => ({
        ...e,
        actor: userMap.get(e.userId) ?? null,
      }))
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    const updatedAt = row.updatedAt ?? null;
    const updatedByUserId = row.updatedByUserId ?? null;
    let lastActor: PublicUser | null = null;
    let lastUpdatedAt: string | null = null;
    if (updatedByUserId && updatedAt) {
      lastActor = userMap.get(updatedByUserId) ?? null;
      lastUpdatedAt = updatedAt;
    }
    if (file?.createdBy) {
      const fileAt = file.createdAt;
      if (!lastUpdatedAt || new Date(fileAt) >= new Date(lastUpdatedAt)) {
        lastActor = file.createdBy;
        lastUpdatedAt = fileAt;
      }
    }

    return {
      definition: def,
      fiche: {
        reference: row.reference ?? '',
        issuedAt: row.issuedAt ?? null,
        expiresAt: row.expiresAt ?? null,
        notes: row.notes ?? '',
        fileAssetId: fid,
      },
      file,
      lastActor,
      lastUpdatedAt,
      history,
    };
  });

  let withFile = 0;
  let expiringSoon = 0;
  let expired = 0;
  for (const s of slots) {
    if (s.file) withFile += 1;
    const d = daysUntil(s.fiche.expiresAt ?? null);
    if (d != null) {
      if (d < 0) expired += 1;
      else if (d <= 60) expiringSoon += 1;
    }
  }

  return ok({
    settingsId: settings.id,
    slots,
    summary: {
      totalSlots: ADMIN_DOCUMENT_SLOTS.length,
      withFile,
      expiringSoon,
      expired,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  const actorId = session.user?.id;
  if (!actorId || typeof actorId !== 'string') {
    return fail('Session utilisateur invalide.', 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail('JSON invalide.', 400);
  }
  const b = body as { slotId?: string; patch?: Record<string, unknown> };
  const slotId = typeof b.slotId === 'string' ? b.slotId.trim() : '';
  const patch = b.patch;
  if (!slotId || !ADMIN_DOCUMENT_SLOT_IDS.has(slotId)) {
    return fail('Identifiant de document invalide.', 400);
  }

  const settings = await loadSystemSettings();
  if (!settings) return fail('Configuration établissement introuvable.', 404);

  const dossier = parseDossier(settings.administrativeDossier);
  const prev = dossier[slotId] || {};
  const next: AdministrativeDossierJson[string] = { ...prev };

  const nowIso = new Date().toISOString();
  const summaries: string[] = [];

  if (patch && typeof patch === 'object') {
    if (typeof patch.reference === 'string') {
      const v = patch.reference.trim().slice(0, 500);
      if (v !== (prev.reference ?? '')) summaries.push('référence');
      next.reference = v;
    }
    if ('issuedAt' in patch) {
      const v =
        patch.issuedAt === null || patch.issuedAt === ''
          ? null
          : String(patch.issuedAt).slice(0, 32);
      if (v !== (prev.issuedAt ?? null)) summaries.push("date d'émission");
      next.issuedAt = v;
    }
    if ('expiresAt' in patch) {
      const v =
        patch.expiresAt === null || patch.expiresAt === ''
          ? null
          : String(patch.expiresAt).slice(0, 32);
      if (v !== (prev.expiresAt ?? null)) summaries.push("date d'expiration");
      next.expiresAt = v;
    }
    if (typeof patch.notes === 'string') {
      const v = patch.notes.trim().slice(0, 4000);
      if (v !== (prev.notes ?? '')) summaries.push('notes');
      next.notes = v;
    }
    if ('fileAssetId' in patch) {
      const fid = patch.fileAssetId;
      const nextFid = fid === null || fid === '' ? null : typeof fid === 'string' ? fid.trim() : prev.fileAssetId;
      const prevFid = prev.fileAssetId ?? null;
      if (nextFid !== prevFid) {
        if (!prevFid && nextFid) summaries.push('fichier joint');
        else if (prevFid && !nextFid) summaries.push('fichier détaché');
        else summaries.push('fichier remplacé');
      }
      next.fileAssetId = nextFid ?? null;
    }
  }

  const changed =
    normStr(next.reference) !== normStr(prev.reference) ||
    (next.issuedAt ?? null) !== (prev.issuedAt ?? null) ||
    (next.expiresAt ?? null) !== (prev.expiresAt ?? null) ||
    normStr(next.notes) !== normStr(prev.notes) ||
    (next.fileAssetId ?? null) !== (prev.fileAssetId ?? null);

  if (changed) {
    let action: AdministrativeDossierHistoryEntry['action'] = 'FICHE_UPDATE';
    const prevF = prev.fileAssetId ?? null;
    const nextF = next.fileAssetId ?? null;
    if (prevF !== nextF) {
      if (!prevF && nextF) action = 'FILE_ATTACHED';
      else if (prevF && !nextF) action = 'FILE_DETACHED';
      else action = 'FILE_REPLACED';
    } else if (summaries.length === 0) {
      action = 'FICHE_UPDATE';
    }

    const summary =
      summaries.length > 0
        ? summaries.join(', ')
        : action === 'FICHE_UPDATE'
          ? 'Fiche enregistrée'
          : action === 'FILE_ATTACHED'
            ? 'Fichier joint'
            : action === 'FILE_DETACHED'
              ? 'Fichier détaché'
              : 'Fichier remplacé';

    next.history = appendHistory(prev, {
      at: nowIso,
      userId: actorId,
      action,
      summary,
    });
    next.updatedAt = nowIso;
    next.updatedByUserId = actorId;
  }

  dossier[slotId] = next;

  await prisma.systemSetting.update({
    where: { id: settings.id },
    data: { administrativeDossier: dossier as Prisma.InputJsonValue },
  });

  return ok({ slotId, fiche: next });
}
