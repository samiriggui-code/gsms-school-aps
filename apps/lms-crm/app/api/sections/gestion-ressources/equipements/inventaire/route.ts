import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@repo/storage';
import {
  buildUnitSerialNumber,
  defaultStatusForUnitIndex,
  EQUIPMENT_HEADQUARTERS_SITE_NAME,
  extractUnitIndex,
  getCatalogBaseSerial,
  isLegacyEquipmentClone,
} from '@/lib/equipment-catalog';

function buildSearchWhere(query: string | null) {
  if (!query) return {};
  return {
    OR: [
      { label: { contains: query, mode: 'insensitive' as const } },
      { serialNumber: { contains: query, mode: 'insensitive' as const } },
    ],
  };
}

function mapEquipmentRow(item: {
  id: string;
  serialNumber: string;
  label: string;
  type: string | null;
  status: string;
  metadata: unknown;
  avatar?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  assignedSite: { id: string; name: string } | null;
  _count?: {
    stockMovements: number;
    maintenanceItems: number;
    sessions: number;
  };
}, statusStats: { label: string; status: string }[]) {
  const avatar =
    item.avatar?.trim() ||
    (item.metadata && (item.metadata as { avatar?: string }).avatar
      ? (item.metadata as { avatar: string }).avatar
      : null);

  const related = statusStats.filter((s) => s.label === item.label);
  const stats = {
    currentStock: related.filter((r) => r.status === 'AVAILABLE').length,
    totalIn: related.filter((r) => r.status === 'IN_USE').length,
    totalOut: related.filter((r) => r.status === 'MAINTENANCE').length,
  };

  const unitIndex = extractUnitIndex(item.serialNumber);

  return {
    id: item.id,
    serialNumber: item.serialNumber,
    label: item.label,
    type: item.type || null,
    status: item.status,
    avatar,
    unitIndex,
    unitLabel: item.serialNumber,
    assignedSite: item.assignedSite || { name: EQUIPMENT_HEADQUARTERS_SITE_NAME },
    metadata: item.metadata,
    createdAt: item.createdAt?.toISOString?.() ?? item.createdAt,
    updatedAt: item.updatedAt?.toISOString?.() ?? item.updatedAt,
    stockStats: stats,
    _count: item._count,
  };
}

async function fetchCatalogEntries(query: string | null) {
  const where = buildSearchWhere(query);
  const rows = await prisma.equipment.findMany({
    where,
    orderBy: [{ label: 'asc' }, { serialNumber: 'asc' }],
    include: {
      assignedSite: true,
      _count: {
        select: {
          stockMovements: true,
          maintenanceItems: true,
          sessions: true,
        },
      },
    },
  });

  const filtered = rows.filter((row) => !isLegacyEquipmentClone(row.serialNumber));
  const byLabel = new Map<string, typeof filtered>();

  for (const row of filtered) {
    const list = byLabel.get(row.label) ?? [];
    list.push(row);
    byLabel.set(row.label, list);
  }

  return Array.from(byLabel.entries()).map(([label, units]) => {
    const representative =
      units.find((u) => extractUnitIndex(u.serialNumber) === 1) ?? units[0];
    const stats = {
      currentStock: units.filter((u) => u.status === 'AVAILABLE').length,
      totalIn: units.filter((u) => u.status === 'IN_USE').length,
      totalOut: units.filter((u) => u.status === 'MAINTENANCE').length,
    };

    return {
      id: representative.id,
      catalogKey: label,
      isCatalogEntry: true,
      serialNumber: getCatalogBaseSerial(representative.serialNumber),
      label,
      type: representative.type || null,
      status: 'CATALOG' as const,
      avatar:
        representative.avatar?.trim() ||
        (representative.metadata && (representative.metadata as { avatar?: string }).avatar
          ? (representative.metadata as { avatar: string }).avatar
          : null),
      assignedSite: { name: EQUIPMENT_HEADQUARTERS_SITE_NAME },
      metadata: representative.metadata,
      unitCount: units.length,
      stockStats: stats,
      units: units.map((u) => ({
        id: u.id,
        serialNumber: u.serialNumber,
        status: u.status,
        unitIndex: extractUnitIndex(u.serialNumber),
        unitLabel: u.serialNumber,
      })),
    };
  });
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const url = new URL(request.url);
    const limit = Math.max(1, Math.min(500, Number(url.searchParams.get('limit') || 50)));
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const skip = (page - 1) * limit;
    const status = url.searchParams.get('status');
    const query = url.searchParams.get('query');
    const mode = url.searchParams.get('mode');
    const catalogLabel = url.searchParams.get('label');

    if (mode === 'catalog') {
      const all = await fetchCatalogEntries(query);
      const total = all.length;
      const pageItems = all.slice(skip, skip + limit);
      return ok({
        data: pageItems,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      });
    }

    if (mode === 'catalog-units' && catalogLabel) {
      const units = await prisma.equipment.findMany({
        where: {
          label: catalogLabel,
          ...(query ? buildSearchWhere(query) : {}),
        },
        orderBy: { serialNumber: 'asc' },
        include: {
          assignedSite: true,
          maintenanceItems: { orderBy: { scheduledDate: 'desc' }, take: 3 },
          sessions: {
            take: 5,
            orderBy: { startDate: 'desc' },
            select: {
              id: true,
              title: true,
              startDate: true,
              endDate: true,
              location: true,
            },
          },
          _count: {
            select: {
              stockMovements: true,
              maintenanceItems: true,
              sessions: true,
            },
          },
        },
      });

      const filtered = units.filter((u) => !isLegacyEquipmentClone(u.serialNumber));
      const statusStats = filtered.map((u) => ({ label: u.label, status: u.status }));

      return ok({
        catalogKey: catalogLabel,
        label: catalogLabel,
        isCatalogEntry: true,
        assignedSite: { name: EQUIPMENT_HEADQUARTERS_SITE_NAME },
        units: filtered.map((u) => mapEquipmentRow(u, statusStats)),
        stockStats: {
          currentStock: filtered.filter((u) => u.status === 'AVAILABLE').length,
          totalIn: filtered.filter((u) => u.status === 'IN_USE').length,
          totalOut: filtered.filter((u) => u.status === 'MAINTENANCE').length,
        },
      });
    }

    const where: Record<string, unknown> = { ...buildSearchWhere(query) };
    if (status) {
      if (status.includes(',')) {
        where.status = { in: status.split(',') };
      } else {
        where.status = status;
      }
    }

    const [equipments, total, statusStats] = await Promise.all([
      prisma.equipment.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedSite: true,
          _count: {
            select: {
              stockMovements: true,
              maintenanceItems: true,
              sessions: true,
            },
          },
        },
      }),
      prisma.equipment.count({ where }),
      prisma.equipment.findMany({
        where: query ? buildSearchWhere(query) : {},
        select: { label: true, status: true },
      }),
    ]);

    const data = equipments
      .filter((item) => !isLegacyEquipmentClone(item.serialNumber))
      .map((item) => mapEquipmentRow(item, statusStats));

    const totalAvailableCount = await prisma.equipment.count({
      where: {
        ...where,
        status: 'AVAILABLE',
      },
    });

    return ok({
      data,
      totalAvailable: totalAvailableCount,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return fail('Impossible de recuperer l’inventaire.', 500, error);
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const contentType = request.headers.get('content-type') || '';
    let data: Record<string, unknown> = {};
    let unitCount = 3;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const baseSerial =
        (formData.get('serialNumber') as string) ||
        `EQ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      data = {
        serialNumber: baseSerial,
        label: formData.get('label') as string,
        type: formData.get('type') as string,
        status: (formData.get('status') || 'AVAILABLE') as string,
      };
      const metadataStr = formData.get('metadata') as string;
      data.metadata = metadataStr ? JSON.parse(metadataStr) : {};
      const rawUnitCount = formData.get('unitCount');
      if (rawUnitCount) unitCount = Math.max(1, Math.min(20, Number(rawUnitCount) || 3));
      const assignedSiteId = formData.get('assignedSiteId');
      if (assignedSiteId && assignedSiteId !== 'null' && assignedSiteId !== '') {
        data.assignedSite = { connect: { id: assignedSiteId as string } };
      }
      const avatar = formData.get('avatar');
      if (avatar && avatar instanceof File && avatar.size > 0) {
        const uploaded = await uploadFile({
          file: avatar,
          module: 'gestion-ressources',
          entityType: 'equipment',
          entityId: String(data.serialNumber || 'catalog'),
          category: 'avatar',
          visibility: 'public',
        });
        (data.metadata as Record<string, unknown>).avatar = uploaded.url;
      }
    } else {
      const body = await request.json();
      const { assignedSiteId, metadata, avatar, unitCount: bodyUnitCount, ...rest } = body;
      data = { ...rest, metadata: metadata || {} };
      if (!data.serialNumber) {
        data.serialNumber = `EQ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      }
      if (bodyUnitCount) unitCount = Math.max(1, Math.min(20, Number(bodyUnitCount) || 3));
      if (assignedSiteId && assignedSiteId !== 'null' && assignedSiteId !== '') {
        data.assignedSite = { connect: { id: assignedSiteId } };
      }
      if (avatar) {
        (data.metadata as Record<string, unknown>).avatar = avatar;
      }
    }

    const baseSerial = getCatalogBaseSerial(String(data.serialNumber));
    const label = String(data.label || '');
    const { status: _ignoredStatus, serialNumber: _ignoredSn, ...createBase } = data;

    const created = [];
    const sharedAvatar =
      data.metadata && typeof data.metadata === 'object' && 'avatar' in (data.metadata as object)
        ? (data.metadata as { avatar?: string }).avatar
        : undefined;

    for (let i = 1; i <= unitCount; i++) {
      const prismaData = {
        ...createBase,
        label,
        serialNumber: buildUnitSerialNumber(baseSerial, i),
        status: defaultStatusForUnitIndex(i),
        ...(sharedAvatar ? { avatar: sharedAvatar } : {}),
      };
      const equipment = await prisma.equipment.create({
        data: prismaData as never,
        include: { assignedSite: true },
      });
      created.push(equipment);
    }

    const representative = created[0];
    if (representative.metadata && (representative.metadata as { avatar?: string }).avatar) {
      (representative as { avatar?: string }).avatar = (
        representative.metadata as { avatar: string }
      ).avatar;
    }

    return ok({
      ...representative,
      isCatalogEntry: true,
      catalogKey: label,
      unitCount: created.length,
      units: created.map((u) => ({
        id: u.id,
        serialNumber: u.serialNumber,
        status: u.status,
        unitIndex: extractUnitIndex(u.serialNumber),
      })),
    });
  } catch (error) {
    console.error('[INVENTORY_POST]', error);
    return fail('Impossible de créer l’équipement.', 500, error);
  }
}
