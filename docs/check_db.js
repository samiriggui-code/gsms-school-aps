const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  try {
    const eq = await prisma.equipment.findMany({
      take: 20,
      select: {
        id: true,
        label: true,
        serialNumber: true,
        status: true,
        assignedSiteId: true,
        assignedSite: { select: { name: true } }
      }
    });
    console.log('EQUIPMENT:', JSON.stringify(eq, null, 2));
    const sites = await prisma.clientSite.findMany({
      select: { id: true, name: true }
    });
    console.log('SITES:', JSON.stringify(sites, null, 2));
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
run();
