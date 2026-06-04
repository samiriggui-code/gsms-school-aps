const { PrismaClient } = require('../packages/database/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Début de la mise à jour des unités d\'équipement...');

  // 1. Récupérer tous les équipements de base (on prend les originaux)
  const baseEquipments = await prisma.equipment.findMany();
  
  for (const eq of baseEquipments) {
    console.log(`Traitement de: ${eq.label}`);

    // S'assurer que l'unité d'origine est AVAILABLE
    await prisma.equipment.update({
      where: { id: eq.id },
      data: { status: 'AVAILABLE' }
    });

    // Créer la 2ème unité (IN_USE)
    const sn2 = `${eq.serialNumber}-USE`;
    await prisma.equipment.upsert({
      where: { serialNumber: sn2 },
      update: { status: 'IN_USE' },
      create: {
        label: eq.label,
        serialNumber: sn2,
        type: eq.type,
        status: 'IN_USE',
        metadata: eq.metadata,
        assignedSiteId: eq.assignedSiteId
      }
    });

    // Créer la 3ème unité (MAINTENANCE)
    const sn3 = `${eq.serialNumber}-MNT`;
    await prisma.equipment.upsert({
      where: { serialNumber: sn3 },
      update: { status: 'MAINTENANCE' },
      create: {
        label: eq.label,
        serialNumber: sn3,
        type: eq.type,
        status: 'MAINTENANCE',
        metadata: eq.metadata,
        assignedSiteId: eq.assignedSiteId
      }
    });
  }

  console.log('Mise à jour terminée. Chaque équipement a maintenant 3 unités (Stock, Session, Maintenance).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
