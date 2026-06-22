/**
 * Fusionne les RhPosition en double (même libellé, souvent orphelines sans code).
 * Réassigne User.jobPositionId et RhOrgUnit.positionId avant suppression.
 */
const { RH_POSITIONS } = require('./rh-metier-catalog');

function normalizeRhPositionLabel(label) {
  return String(label || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/** Libellé normalisé → entrée catalogue (code canonique). */
function buildCatalogByLabel() {
  const map = new Map();
  for (const entry of RH_POSITIONS) {
    map.set(normalizeRhPositionLabel(entry.label), entry);
  }
  return map;
}

function pickRhPositionKeeper(rows, catalogEntry) {
  if (!rows.length) return null;
  if (rows.length === 1) return rows[0];

  const canonicalCode = catalogEntry?.code;
  if (canonicalCode) {
    const exact = rows.find((r) => r.code === canonicalCode);
    if (exact) return exact;
  }

  const withCode = rows.filter((r) => r.code);
  if (withCode.length === 1) return withCode[0];
  if (withCode.length > 1) {
    return withCode.sort(
      (a, b) =>
        (b._count?.users ?? 0) +
        (b._count?.orgUnits ?? 0) -
        ((a._count?.users ?? 0) + (a._count?.orgUnits ?? 0)) ||
        new Date(a.createdAt) - new Date(b.createdAt),
    )[0];
  }

  return rows.sort(
    (a, b) =>
      (b._count?.users ?? 0) +
      (b._count?.orgUnits ?? 0) -
      ((a._count?.users ?? 0) + (a._count?.orgUnits ?? 0)) ||
      new Date(a.createdAt) - new Date(b.createdAt),
  )[0];
}

async function listRhPositionDuplicateGroups(tx) {
  const rows = await tx.rhPosition.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: {
      _count: { select: { users: true, orgUnits: true } },
    },
  });

  const catalogByLabel = buildCatalogByLabel();
  const groups = new Map();

  for (const row of rows) {
    const key = normalizeRhPositionLabel(row.label);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  const duplicates = [];
  for (const [labelKey, members] of groups) {
    if (members.length <= 1) continue;
    const catalogEntry = catalogByLabel.get(labelKey) ?? null;
    const keeper = pickRhPositionKeeper(members, catalogEntry);
    duplicates.push({
      labelKey,
      catalogCode: catalogEntry?.code ?? null,
      keeper,
      orphans: members.filter((r) => r.id !== keeper.id),
    });
  }

  return { totalPositions: rows.length, duplicateGroups: duplicates };
}

/**
 * @param {import('@prisma/client').Prisma.TransactionClient} tx
 * @param {{ dryRun?: boolean }} [options]
 */
async function dedupeRhPositionsInTx(tx, options = {}) {
  const dryRun = Boolean(options.dryRun);
  const catalogByLabel = buildCatalogByLabel();

  const stats = {
    dryRun,
    groupsProcessed: 0,
    positionsDeleted: 0,
    usersReassigned: 0,
    orgUnitsReassigned: 0,
    keepersEnriched: 0,
  };

  const { duplicateGroups } = await listRhPositionDuplicateGroups(tx);

  for (const group of duplicateGroups) {
    const { keeper, orphans, labelKey } = group;
    const catalogEntry = catalogByLabel.get(labelKey) ?? null;
    stats.groupsProcessed += 1;

    for (const orphan of orphans) {
      if (!dryRun) {
        const userUpdate = await tx.user.updateMany({
          where: { jobPositionId: orphan.id },
          data: {
            jobPositionId: keeper.id,
            jobFunction: catalogEntry?.label ?? keeper.label,
          },
        });
        stats.usersReassigned += userUpdate.count;

        const orgUpdate = await tx.rhOrgUnit.updateMany({
          where: { positionId: orphan.id },
          data: { positionId: keeper.id },
        });
        stats.orgUnitsReassigned += orgUpdate.count;

        await tx.rhPosition.delete({ where: { id: orphan.id } });
      } else {
        stats.usersReassigned += orphan._count?.users ?? 0;
        stats.orgUnitsReassigned += orphan._count?.orgUnits ?? 0;
      }
      stats.positionsDeleted += 1;
    }

    if (catalogEntry && !dryRun) {
      const needsEnrich =
        keeper.code !== catalogEntry.code ||
        keeper.schoolInternalService !== catalogEntry.schoolInternalService ||
        keeper.sortOrder !== catalogEntry.sortOrder ||
        keeper.label !== catalogEntry.label;

      if (needsEnrich) {
        await tx.rhPosition.update({
          where: { id: keeper.id },
          data: {
            code: catalogEntry.code,
            label: catalogEntry.label,
            schoolInternalService: catalogEntry.schoolInternalService,
            sortOrder: catalogEntry.sortOrder,
          },
        });

        await tx.user.updateMany({
          where: { jobPositionId: keeper.id },
          data: { jobFunction: catalogEntry.label },
        });

        stats.keepersEnriched += 1;
      }
    }
  }

  return stats;
}

/**
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {{ dryRun?: boolean }} [options]
 */
async function dedupeRhPositions(prisma, options = {}) {
  return prisma.$transaction((tx) => dedupeRhPositionsInTx(tx, options));
}

module.exports = {
  normalizeRhPositionLabel,
  listRhPositionDuplicateGroups,
  dedupeRhPositionsInTx,
  dedupeRhPositions,
};
