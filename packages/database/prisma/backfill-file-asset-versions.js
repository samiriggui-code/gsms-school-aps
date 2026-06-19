/**
 * Crée la version 1 pour chaque FileAsset sans currentVersionId.
 * Usage après db:push (FileAssetVersion) :
 *   pnpm db:backfill-file-versions
 */
const fs = require('fs');
const path = require('path');

function loadRootEnv() {
  const candidates = [
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../.env'),
  ];
  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
    break;
  }
}

loadRootEnv();

const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { PrismaClient } = require(path.join(__dirname, '../generated/client'));

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const assets = await prisma.fileAsset.findMany({
    where: { currentVersionId: null },
    select: {
      id: true,
      storageKey: true,
      url: true,
      mimeType: true,
      size: true,
      status: true,
      createdById: true,
      createdAt: true,
    },
  });

  if (assets.length === 0) {
    console.log('OK — aucun FileAsset à migrer.');
    return;
  }

  let migrated = 0;
  for (const asset of assets) {
    const version = await prisma.fileAssetVersion.create({
      data: {
        fileAssetId: asset.id,
        versionNumber: 1,
        storageKey: asset.storageKey,
        url: asset.url,
        mimeType: asset.mimeType,
        size: asset.size,
        changeReason: 'Migration version initiale',
        status:
          asset.status === 'ARCHIVED'
            ? 'ARCHIVED'
            : asset.status === 'DELETED'
              ? 'ARCHIVED'
              : 'ACTIVE',
        createdById: asset.createdById,
        createdAt: asset.createdAt,
      },
    });

    await prisma.fileAsset.update({
      where: { id: asset.id },
      data: { currentVersionId: version.id },
    });
    migrated += 1;
  }

  console.log(`OK — ${migrated} FileAsset(s) versionnés.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
