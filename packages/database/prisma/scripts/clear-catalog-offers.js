/**
 * Usage (dev): vide toutes les offres catalogue pour tester l’ajout manuel.
 * Ne supprime pas les fiches Formation (référentiel).
 */
const path = require('node:path');
const { PrismaClient } = require(path.join(__dirname, '../../generated/client'));

async function main() {
  const prisma = new PrismaClient();
  try {
    const r = await prisma.formationCatalogOffer.deleteMany({});
    console.log('FormationCatalogOffer supprimées:', r.count);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
