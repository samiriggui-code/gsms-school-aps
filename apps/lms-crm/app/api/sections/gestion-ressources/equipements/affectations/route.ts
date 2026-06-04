import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';

type AffectationRow = {
  id: string;
  sessionId: string;
  sessionTitle: string;
  startDate: Date | null;
  endDate: Date | null;
  clientSiteName: string | null;
  equipmentId: string;
  equipmentLabel: string;
  equipmentSerial: string;
  equipmentAvatar: string | null;
  equipmentMetadata: unknown;
};

const resolveEquipmentAvatar = (row: AffectationRow) => {
  if (row.equipmentAvatar?.trim()) return row.equipmentAvatar.trim();
  if (row.equipmentMetadata && typeof row.equipmentMetadata === 'object') {
    const fromMeta = (row.equipmentMetadata as { avatar?: string }).avatar;
    return fromMeta?.trim() ? fromMeta.trim() : null;
  }
  return null;
};

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const limit = Math.max(1, Math.min(50, Number(url.searchParams.get('limit') || 6)));
    const skip = (page - 1) * limit;
    const query = url.searchParams.get('query')?.trim();
    const pattern = query ? `%${query}%` : null;

    const [rows, totalRows] = pattern
      ? await Promise.all([
          prisma.$queryRaw<AffectationRow[]>`
            SELECT
              CONCAT(e.id, '-', fs.id) as id,
              fs.id as "sessionId",
              COALESCE(fs."sessionSubtitle", fs."dateDisplayLabel", f.name, 'Session') as "sessionTitle",
              fs."startDate" as "startDate",
              fs."endDate" as "endDate",
              COALESCE(vr.name, fs.location) as "clientSiteName",
              e.id as "equipmentId",
              e.label as "equipmentLabel",
              e."serialNumber" as "equipmentSerial",
              e.avatar as "equipmentAvatar",
              e.metadata as "equipmentMetadata"
            FROM "FormationSession" fs
            CROSS JOIN LATERAL jsonb_array_elements_text(
              CASE
                WHEN jsonb_typeof(fs."reservedEquipmentIds"::jsonb) = 'array'
                THEN fs."reservedEquipmentIds"::jsonb
                ELSE '[]'::jsonb
              END
            ) AS reserved(elem)
            INNER JOIN "Equipment" e ON e.id = reserved.elem
            LEFT JOIN "Formation" f ON f.id = fs."formationId"
            LEFT JOIN "FormationVenueRoom" vr ON vr.id = fs."venueRoomId"
            WHERE COALESCE(fs."sessionSubtitle", fs."dateDisplayLabel", f.name, '') ILIKE ${pattern}
              OR e.label ILIKE ${pattern}
              OR e."serialNumber" ILIKE ${pattern}
              OR COALESCE(vr.name, fs.location, '') ILIKE ${pattern}
            ORDER BY fs."startDate" DESC NULLS LAST
            LIMIT ${limit} OFFSET ${skip}
          `,
          prisma.$queryRaw<Array<{ count: bigint }>>`
            SELECT COUNT(*)::bigint as count
            FROM "FormationSession" fs
            CROSS JOIN LATERAL jsonb_array_elements_text(
              CASE
                WHEN jsonb_typeof(fs."reservedEquipmentIds"::jsonb) = 'array'
                THEN fs."reservedEquipmentIds"::jsonb
                ELSE '[]'::jsonb
              END
            ) AS reserved(elem)
            INNER JOIN "Equipment" e ON e.id = reserved.elem
            LEFT JOIN "Formation" f ON f.id = fs."formationId"
            LEFT JOIN "FormationVenueRoom" vr ON vr.id = fs."venueRoomId"
            WHERE COALESCE(fs."sessionSubtitle", fs."dateDisplayLabel", f.name, '') ILIKE ${pattern}
              OR e.label ILIKE ${pattern}
              OR e."serialNumber" ILIKE ${pattern}
              OR COALESCE(vr.name, fs.location, '') ILIKE ${pattern}
          `,
        ])
      : await Promise.all([
          prisma.$queryRaw<AffectationRow[]>`
            SELECT
              CONCAT(e.id, '-', fs.id) as id,
              fs.id as "sessionId",
              COALESCE(fs."sessionSubtitle", fs."dateDisplayLabel", f.name, 'Session') as "sessionTitle",
              fs."startDate" as "startDate",
              fs."endDate" as "endDate",
              COALESCE(vr.name, fs.location) as "clientSiteName",
              e.id as "equipmentId",
              e.label as "equipmentLabel",
              e."serialNumber" as "equipmentSerial",
              e.avatar as "equipmentAvatar",
              e.metadata as "equipmentMetadata"
            FROM "FormationSession" fs
            CROSS JOIN LATERAL jsonb_array_elements_text(
              CASE
                WHEN jsonb_typeof(fs."reservedEquipmentIds"::jsonb) = 'array'
                THEN fs."reservedEquipmentIds"::jsonb
                ELSE '[]'::jsonb
              END
            ) AS reserved(elem)
            INNER JOIN "Equipment" e ON e.id = reserved.elem
            LEFT JOIN "Formation" f ON f.id = fs."formationId"
            LEFT JOIN "FormationVenueRoom" vr ON vr.id = fs."venueRoomId"
            ORDER BY fs."startDate" DESC NULLS LAST
            LIMIT ${limit} OFFSET ${skip}
          `,
          prisma.$queryRaw<Array<{ count: bigint }>>`
            SELECT COUNT(*)::bigint as count
            FROM "FormationSession" fs
            CROSS JOIN LATERAL jsonb_array_elements_text(
              CASE
                WHEN jsonb_typeof(fs."reservedEquipmentIds"::jsonb) = 'array'
                THEN fs."reservedEquipmentIds"::jsonb
                ELSE '[]'::jsonb
              END
            ) AS reserved(elem)
            INNER JOIN "Equipment" e ON e.id = reserved.elem
          `,
        ]);

    const total = Number(totalRows[0]?.count ?? 0);

    const data = rows.map((row) => ({
      id: row.id,
      sessionId: row.sessionId,
      sessionTitle: row.sessionTitle,
      startDate: row.startDate,
      endDate: row.endDate,
      clientSiteName: row.clientSiteName,
      equipmentId: row.equipmentId,
      equipmentLabel: row.equipmentLabel,
      equipmentSerial: row.equipmentSerial,
      equipmentAvatar: resolveEquipmentAvatar(row),
    }));

    return ok({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('[AFFECTATIONS_LIST]', error);
    return fail('Impossible de récupérer les affectations récentes.', 500, error);
  }
}
